import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
};

// gpt-4o-mini pricing (USD per 1K tokens, as of 2025)
const PRICE_INPUT_PER_1K = 0.00015;
const PRICE_OUTPUT_PER_1K = 0.0006;
const USD_TO_EUR = 0.92;

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type Message = { role: 'user' | 'assistant'; content: string };

type PlanetEntry = { sign?: string; house?: number } | string | undefined;

/**
 * Builds a compact natal chart string (~50-80 tokens vs ~500 for pretty JSON).
 * Example: "S:Bélier/H1 M:Cancer/H4 Mc:Taureau V:Poissons Ma:Gémeaux Asc:Poissons"
 */
function compactNatalChart(natal: Record<string, unknown>): string {
  const extract = (key: string): string | null => {
    const val = natal[key] as PlanetEntry;
    if (!val) return null;
    if (typeof val === 'string') return val;
    return val.sign ? `${val.sign}${val.house ? `/H${val.house}` : ''}` : null;
  };

  const PLANETS: Array<[string, string]> = [
    ['sun', 'S'], ['moon', 'M'], ['mercury', 'Mc'],
    ['venus', 'V'], ['mars', 'Ma'], ['jupiter', 'Ju'], ['saturn', 'Sa'],
  ];

  const parts: string[] = [];
  for (const [key, abbr] of PLANETS) {
    const v = extract(key);
    if (v) parts.push(`${abbr}:${v}`);
  }
  const asc = extract('ascendant') ?? extract('rising');
  if (asc) parts.push(`Asc:${asc}`);

  return parts.length > 0 ? parts.join(' ') : JSON.stringify(natal).slice(0, 350);
}

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: HEADERS, body: '' };
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: HEADERS, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { question, firstName, natalChart, userId, conversationId } = JSON.parse(event.body || '{}') as {
      question: unknown;
      firstName: unknown;
      natalChart: unknown;
      userId: unknown;
      conversationId: unknown;
    };

    if (
      !question || typeof question !== 'string' || !question.trim() ||
      !firstName || typeof firstName !== 'string' || !firstName.trim() ||
      !natalChart || typeof natalChart !== 'object' ||
      !userId || typeof userId !== 'string' || !userId.trim()
    ) {
      return { statusCode: 400, headers: HEADERS, body: JSON.stringify({ error: 'Paramètres manquants ou invalides' }) };
    }

    // ── Quota check (BEFORE loading conversation or calling OpenAI) ─────────
    const { data: consumeResult, error: consumeError } = await supabase.rpc(
      'consume_chat_message',
      { p_user_id: userId }
    );

    if (consumeError) {
      // Fail-closed : un RPC qui plante est anormal — on refuse plutôt que d'offrir
      // un message gratuit (évite l'exploitation si un attaquant fait planter le RPC).
      console.error('[astro-chatbot] consume_chat_message RPC error:', consumeError.message);
      return {
        statusCode: 503,
        headers: HEADERS,
        body: JSON.stringify({ error: 'Service temporairement indisponible. Réessaie dans un instant.' }),
      };
    }
    if (consumeResult && !(consumeResult as { success: boolean }).success) {
      const reason = (consumeResult as { reason: string }).reason;
      if (reason === 'quota_exceeded') {
        return {
          statusCode: 402,
          headers: HEADERS,
          body: JSON.stringify({ needsExtraPack: true, remaining: 0 }),
        };
      }
      if (reason === 'inactive_subscription') {
        return {
          statusCode: 403,
          headers: HEADERS,
          body: JSON.stringify({ needsSubscription: true }),
        };
      }
    }

    // Capture consume result for potential refund
    const consumeOk = !consumeError && consumeResult && (consumeResult as { success: boolean }).success;
    const consumeSource = consumeOk ? (consumeResult as { source: string }).source : null;
    const consumePackId = consumeOk ? (consumeResult as { pack_id?: string }).pack_id ?? null : null;
    // ─────────────────────────────────────────────────────────────────────────

    // Load or create conversation
    let convId = typeof conversationId === 'string' ? conversationId : null;
    let messages: Message[] = [];

    if (convId) {
      const { data } = await supabase
        .from('conversations')
        .select('messages')
        .eq('id', convId)
        .single();
      if (data) messages = (data.messages as Message[]) ?? [];
    } else {
      const { data } = await supabase
        .from('conversations')
        .insert({ user_id: userId, messages: [], preferences: {} })
        .select('id')
        .single();
      convId = data?.id ?? null;
    }

    // Load long-term memory summary (non-blocking if missing)
    const { data: memoryRow } = await supabase
      .from('chat_memory')
      .select('summary')
      .eq('user_id', userId)
      .single();
    const memorySummary: string | null = memoryRow?.summary ?? null;

    // Build compact system prompt (~150-250 tokens)
    const natalStr = compactNatalChart(natalChart as Record<string, unknown>);
    const systemLines = [
      `Tu es Zoé, astrologue digitale bienveillante et directe. Client: ${firstName as string}.`,
      `Thème natal: ${natalStr}`,
      memorySummary ? `Contexte passé: ${memorySummary}` : null,
      `Réponds en 2-4 phrases max. Direct, chaleureux, personnalisé au thème natal. Évite les métaphores lourdes. Termine par une question si pertinent. Jamais de jugement moral.`,
    ].filter(Boolean) as string[];
    const systemPrompt = systemLines.join('\n');

    // Rolling window: last 2 messages raw (rest captured in chat_memory summary)
    const recentMessages = messages.slice(-2);

    const openaiMessages = [
      { role: 'system' as const, content: systemPrompt },
      ...recentMessages,
      { role: 'user' as const, content: question },
    ];

    // Call OpenAI — gpt-4o-mini (20x cheaper than gpt-4 for comparable chat quality)
    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: openaiMessages,
        max_tokens: 400,
        temperature: 0.75,
      }),
    });

    if (!openaiRes.ok) {
      const err = await openaiRes.text();
      console.error('[astro-chatbot] OpenAI error:', err);
      await refundIfConsumed(userId, consumeSource, consumePackId);
      return { statusCode: 500, headers: HEADERS, body: JSON.stringify({ error: 'Erreur OpenAI', details: err }) };
    }

    const openaiData = await openaiRes.json() as {
      choices: Array<{ message: { content: string } }>;
      usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
    };

    const answer = openaiData.choices?.[0]?.message?.content ?? '';
    const usage = openaiData.usage ?? { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };

    // Cost log (info level) — target 0.005-0.008 €/message
    const costEur = (
      (usage.prompt_tokens / 1000) * PRICE_INPUT_PER_1K +
      (usage.completion_tokens / 1000) * PRICE_OUTPUT_PER_1K
    ) * USD_TO_EUR;
    console.info(
      `[chat:cost] in=${usage.prompt_tokens} out=${usage.completion_tokens} ` +
      `total=${usage.total_tokens} cost_eur=${costEur.toFixed(5)} source=${consumeSource ?? 'none'} user=${userId.slice(0, 8)}`
    );

    if (!answer) {
      await refundIfConsumed(userId, consumeSource, consumePackId);
      return { statusCode: 500, headers: HEADERS, body: JSON.stringify({ error: 'Aucune réponse générée' }) };
    }

    // Persist messages
    const updatedMessages: Message[] = [
      ...messages,
      { role: 'user', content: question },
      { role: 'assistant', content: answer },
    ];
    if (convId) {
      await supabase
        .from('conversations')
        .update({ messages: updatedMessages, updated_at: new Date().toISOString() })
        .eq('id', convId);
    }

    // Regenerate rolling summary every 5 messages (fire-and-forget)
    if (updatedMessages.length % 5 === 0) {
      refreshMemorySummary(userId, updatedMessages, memorySummary).catch((e: unknown) =>
        console.error('[chat:memory] refresh failed:', e)
      );
    }

    return {
      statusCode: 200,
      headers: HEADERS,
      body: JSON.stringify({
        answer,
        conversationId: convId,
        // Exposé pour analytics côté client (event chat_message_consumed)
        source: consumeSource,
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: HEADERS,
      body: JSON.stringify({ error: error instanceof Error ? error.message : 'Erreur serveur' }),
    };
  }
};

/** Calls refund_chat_message RPC if a message was successfully consumed. Best-effort. */
async function refundIfConsumed(
  userId: string,
  source: string | null,
  packId: string | null
): Promise<void> {
  if (!source) return;
  const { error } = await supabase.rpc('refund_chat_message', {
    p_user_id: userId,
    p_source: source,
    p_pack_id: packId,
  });
  if (error) console.error('[astro-chatbot] refund_chat_message failed:', error.message);
}

/**
 * Regenerates the long-term memory summary using the last 10 messages.
 * Runs async after the response is sent (non-blocking).
 */
async function refreshMemorySummary(
  userId: string,
  messages: Message[],
  existingSummary: string | null
): Promise<void> {
  const recent = messages
    .slice(-10)
    .map(m => `${m.role === 'user' ? 'User' : 'Zoé'}: ${m.content}`)
    .join('\n');

  const prompt = existingSummary
    ? `Résumé précédent: "${existingSummary}"\n\nNouveaux échanges:\n${recent}\n\nMets à jour en 2-3 phrases max, en retenant sujets importants, préoccupations, faits personnels.`
    : `Résume en 2-3 phrases les points importants de cette conversation astrologique:\n${recent}`;

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 150,
      temperature: 0.3,
    }),
  });

  if (!res.ok) return;

  const data = await res.json() as { choices: Array<{ message: { content: string } }> };
  const summary = data.choices?.[0]?.message?.content ?? null;
  if (!summary) return;

  await supabase
    .from('chat_memory')
    .upsert({ user_id: userId, summary, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
}
