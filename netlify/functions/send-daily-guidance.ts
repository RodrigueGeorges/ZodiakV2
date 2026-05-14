import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import {
  sendWhatsAppTemplate,
  sendInstagramText,
  buildGuidanceShortLink,
  getMetaConfig,
  type Channel,
  type SendResult,
} from './_metaUtils';

/**
 * Cron horaire de la guidance quotidienne — version Meta (WhatsApp + Instagram).
 *
 * Exécution :  toutes les heures (cron `0 * * * *` configuré dans netlify.toml)
 *
 * Logique :
 *   1. Calcule l'heure courante dans CHAQUE fuseau utilisateur. Sélectionne
 *      les profils dont `guidance_hour` correspond ET `daily_guidance_enabled = true`
 *      ET `subscription_status ∈ {active, trial}` ET un canal Meta configuré.
 *   2. Idempotence : skip les profils qui ont déjà reçu un message outbound
 *      `template` aujourd'hui (vérifié via `message_log` sur la date locale user).
 *   3. Pour chaque profil : récupère ou génère un `guidance_token` valide 24h
 *      avec un `short_code` unique.
 *   4. Dispatch :
 *      - WhatsApp : sendWhatsAppTemplate (HSM "guidance_quotidienne")
 *      - Instagram : sendInstagramText (avec MESSAGE_TAG approuvé pour push 24h+)
 *   5. Insère un `message_log` outbound (dont provider_message_id pour le
 *      tracking via webhook).
 *
 * Idempotence + retry sûrs : un nouveau short_code n'est créé que si la ligne
 * `guidance_token` du jour n'existe pas déjà pour ce user.
 *
 * Variables d'env requises : voir `_metaUtils.getMetaConfig()` + Supabase.
 */

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BATCH_SIZE = 200;

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface ProfileForDispatch {
  id: string;
  name: string | null;
  preferred_channel: Channel | null;
  whatsapp_wa_id: string | null;
  instagram_igsid: string | null;
  daily_guidance_enabled: boolean | null;
  guidance_hour: number | null;
  timezone: string | null;
  subscription_status: string | null;
}

interface DailyGuidance {
  id?: string;
  user_id: string;
  date: string;
  summary?: string | null;
}

interface DispatchResult {
  userId: string;
  channel: Channel | null;
  ok: boolean;
  reason?: string;
  errorCode?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers fuseau / date
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Renvoie { hour, dateISO } correspondant à `now` dans `tz`.
 * On utilise Intl.DateTimeFormat (zéro dépendance, dispo Node 18+).
 */
function getLocalTime(tz: string, now: Date = new Date()): { hour: number; dateISO: string } {
  try {
    const fmt = new Intl.DateTimeFormat('en-CA', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    const parts = fmt.formatToParts(now).reduce<Record<string, string>>((acc, p) => {
      acc[p.type] = p.value;
      return acc;
    }, {});
    const hour = parseInt(parts.hour || '0', 10);
    const dateISO = `${parts.year}-${parts.month}-${parts.day}`;
    return { hour, dateISO };
  } catch {
    // Fallback UTC si tz invalide
    const iso = now.toISOString();
    return { hour: now.getUTCHours(), dateISO: iso.slice(0, 10) };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Idempotence : a-t-on déjà envoyé une guidance template à ce user aujourd'hui ?
// ─────────────────────────────────────────────────────────────────────────────

async function alreadySentToday(userId: string, channel: Channel, dateISO: string): Promise<boolean> {
  // On utilise sent_at::date côté SQL via filtre temporel simple.
  // Plage [00:00, 24:00] de la journée locale du user est approximée par
  // [dateISO, dateISO+1) ; pour un cron horaire, c'est largement suffisant.
  const start = `${dateISO}T00:00:00.000Z`;
  const end = `${dateISO}T23:59:59.999Z`;

  const { count, error } = await supabase
    .from('message_log')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('channel', channel)
    .eq('direction', 'outbound')
    .eq('message_type', 'template')
    .gte('sent_at', start)
    .lte('sent_at', end);

  if (error) {
    console.warn('[daily-guidance] alreadySentToday error', error.message);
    return false;
  }
  return (count ?? 0) > 0;
}

// ─────────────────────────────────────────────────────────────────────────────
// Token court de guidance (créé à la demande, expire 24h)
// ─────────────────────────────────────────────────────────────────────────────

function generateShortCode(length = 8): string {
  // Sans caractères ambigus (0/O/1/l/I) pour éviter les erreurs de saisie/lecture
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let out = '';
  for (let i = 0; i < length; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

function generateUUID(): string {
  const c = globalThis.crypto;
  if (c?.randomUUID) return c.randomUUID();
  const bytes = new Uint8Array(16);
  c.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  return [...bytes]
    .map((b, i) => {
      const hex = b.toString(16).padStart(2, '0');
      return i === 4 || i === 6 || i === 8 || i === 10 ? `-${hex}` : hex;
    })
    .join('');
}

async function getOrCreateGuidanceToken(userId: string, dateISO: string): Promise<{
  token: string;
  shortCode: string;
} | null> {
  // 1. Existe-t-il déjà une ligne pour ce user à cette date ?
  const { data: existing } = await supabase
    .from('guidance_token')
    .select('token, short_code, expires_at')
    .eq('user_id', userId)
    .eq('date', dateISO)
    .maybeSingle();

  if (existing && existing.short_code) {
    const stillValid = existing.expires_at && new Date(existing.expires_at) > new Date();
    if (stillValid) {
      return { token: existing.token, shortCode: existing.short_code };
    }
  }

  // 2. Sinon on crée. Avec retry sur collision unique short_code.
  const token = generateUUID();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  for (let attempt = 0; attempt < 5; attempt++) {
    const shortCode = generateShortCode(attempt === 0 ? 8 : 10);
    const { error } = await supabase.from('guidance_token').upsert(
      {
        user_id: userId,
        token,
        date: dateISO,
        expires_at: expiresAt,
        short_code: shortCode,
      },
      { onConflict: 'user_id,date' }
    );
    if (!error) return { token, shortCode };

    const isUniqueViolation =
      error.code === '23505' ||
      (typeof error.message === 'string' && error.message.toLowerCase().includes('unique'));
    if (!isUniqueViolation) {
      console.error('[daily-guidance] guidance_token upsert error', error);
      return null;
    }
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Dispatch d'un profil
// ─────────────────────────────────────────────────────────────────────────────

async function dispatchOne(
  profile: ProfileForDispatch,
  guidance: DailyGuidance | null
): Promise<DispatchResult> {
  const tz = profile.timezone || 'Europe/Paris';
  const { dateISO } = getLocalTime(tz);
  const channel = profile.preferred_channel;

  if (!channel) {
    return { userId: profile.id, channel: null, ok: false, reason: 'NO_CHANNEL' };
  }

  // Skip si pas de canal configuré
  if (channel === 'whatsapp' && !profile.whatsapp_wa_id) {
    return { userId: profile.id, channel, ok: false, reason: 'NO_WA_ID' };
  }
  if (channel === 'instagram' && !profile.instagram_igsid) {
    return { userId: profile.id, channel, ok: false, reason: 'NO_IGSID' };
  }

  // Skip si pas de guidance générée pour aujourd'hui
  if (!guidance) {
    return { userId: profile.id, channel, ok: false, reason: 'NO_GUIDANCE_TODAY' };
  }

  // Idempotence
  if (await alreadySentToday(profile.id, channel, dateISO)) {
    return { userId: profile.id, channel, ok: true, reason: 'ALREADY_SENT' };
  }

  // Token + lien court
  const tk = await getOrCreateGuidanceToken(profile.id, dateISO);
  if (!tk) {
    return { userId: profile.id, channel, ok: false, reason: 'TOKEN_CREATE_FAILED' };
  }
  const shortLink = buildGuidanceShortLink(tk.shortCode);

  const firstName = (profile.name?.split(' ')[0] || 'cher utilisateur').trim();
  const cfg = getMetaConfig();

  // Envoi
  let result: SendResult;
  if (channel === 'whatsapp') {
    result = await sendWhatsAppTemplate({
      to: profile.whatsapp_wa_id!,
      templateName: cfg.guidanceTemplateName,
      languageCode: cfg.guidanceTemplateLang,
      // Le template approuvé par Meta DOIT correspondre à ces variables :
      //   {{1}} = prénom
      //   {{2}} = lien court (placeholder dans body OU dans button URL)
      bodyParams: [{ text: firstName }, { text: shortLink }],
      buttonUrlSuffix: tk.shortCode,
    });
  } else {
    // Instagram : push hors fenêtre 24h → MESSAGE_TAG (à confirmer côté Meta)
    // Pour la phase 1 on tente UPDATE ; passer à RESPONSE si on est sûr d'être
    // dans la fenêtre, ou utiliser Recurring Notifications après opt-in user.
    result = await sendInstagramText({
      to: profile.instagram_igsid!,
      text:
        `✦ ${firstName}, ta guidance cosmique du jour est arrivée.\n\n` +
        `${guidance.summary?.slice(0, 180) ?? 'Découvre ce que les astres te disent aujourd\'hui.'}\n\n` +
        `Lis-la complète ici 👉 ${shortLink}\n(Valable 24h)`,
      messagingType: 'UPDATE',
    });
  }

  // Log dans message_log (success ou échec, pour audit)
  await supabase.from('message_log').insert({
    user_id: profile.id,
    channel,
    direction: 'outbound',
    message_type: 'template',
    template_name: channel === 'whatsapp' ? cfg.guidanceTemplateName : 'instagram_daily_guidance',
    short_code: tk.shortCode,
    provider_message_id: result.providerMessageId ?? null,
    payload: { firstName, shortLink, raw: result.raw } as Record<string, unknown>,
    sent_at: new Date().toISOString(),
    failed_at: result.ok ? null : new Date().toISOString(),
    error_code: result.errorCode ?? null,
    error_message: result.errorMessage ?? null,
  });

  // Mise à jour profile.last_guidance_sent (rétrocompat colonne existante)
  if (result.ok) {
    await supabase
      .from('profiles')
      .update({ last_guidance_sent: new Date().toISOString() })
      .eq('id', profile.id);
  }

  return {
    userId: profile.id,
    channel,
    ok: result.ok,
    reason: result.ok ? 'SENT' : 'SEND_FAILED',
    errorCode: result.errorCode,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Handler Netlify (cron horaire)
// ─────────────────────────────────────────────────────────────────────────────

const handler: Handler = async () => {
  const now = new Date();
  const startedAt = Date.now();

  // On parcourt tous les fuseaux, mais en pratique on filtre côté SQL par
  // l'heure UTC qui correspond à `guidance_hour` du user. Comme on ne connaît
  // pas l'offset à l'avance, on récupère TOUS les profils avec
  // daily_guidance_enabled = true et un canal configuré, puis on filtre côté
  // app par `getLocalTime(profile.timezone).hour === profile.guidance_hour`.
  // Avec les volumes attendus (< 100k profils éligibles), c'est OK.
  // Pour scaler au-delà, on précalculera `dispatch_utc_hour` en colonne.

  let offset = 0;
  let total = 0;
  let dispatched = 0;
  let skipped = 0;
  let errors = 0;
  const reasons: Record<string, number> = {};

  // Eligibilité minimale côté SQL (gros filtre)
  // - daily_guidance_enabled = true
  // - subscription_status ∈ {active, trial}
  // - au moins un canal configuré
  while (true) {
    const { data, error } = await supabase
      .from('profiles')
      .select(
        'id, name, preferred_channel, whatsapp_wa_id, instagram_igsid, daily_guidance_enabled, guidance_hour, timezone, subscription_status'
      )
      .eq('daily_guidance_enabled', true)
      .in('subscription_status', ['active', 'trial'])
      .or('whatsapp_wa_id.not.is.null,instagram_igsid.not.is.null')
      .range(offset, offset + BATCH_SIZE - 1);

    if (error) {
      console.error('[daily-guidance] select profiles failed', error.message);
      break;
    }
    if (!data || data.length === 0) break;

    // Filtrage app : matching heure locale
    const dueProfiles: ProfileForDispatch[] = [];
    for (const p of data as ProfileForDispatch[]) {
      total++;
      const tz = p.timezone || 'Europe/Paris';
      const { hour } = getLocalTime(tz, now);
      if (p.guidance_hour === hour) {
        dueProfiles.push(p);
      }
    }

    if (dueProfiles.length === 0) {
      offset += BATCH_SIZE;
      continue;
    }

    // Récupérer les daily_guidance d'aujourd'hui pour ces users (par date locale).
    // On groupe par date locale pour limiter les requêtes.
    const guidanceByUserDate = new Map<string, DailyGuidance>();
    const datesNeeded = new Set<string>();
    const userDateMap = new Map<string, string>();
    for (const p of dueProfiles) {
      const tz = p.timezone || 'Europe/Paris';
      const { dateISO } = getLocalTime(tz, now);
      userDateMap.set(p.id, dateISO);
      datesNeeded.add(dateISO);
    }
    for (const dateISO of datesNeeded) {
      const userIds = dueProfiles.filter((p) => userDateMap.get(p.id) === dateISO).map((p) => p.id);
      if (userIds.length === 0) continue;
      const { data: gs } = await supabase
        .from('daily_guidance')
        .select('id, user_id, date, summary')
        .in('user_id', userIds)
        .eq('date', dateISO);
      for (const g of (gs || []) as DailyGuidance[]) {
        guidanceByUserDate.set(`${g.user_id}::${g.date}`, g);
      }
    }

    // Dispatch séquentiel (volume modeste, on évite la rafale Meta API)
    for (const p of dueProfiles) {
      const dateISO = userDateMap.get(p.id) || '';
      const guidance = guidanceByUserDate.get(`${p.id}::${dateISO}`) ?? null;
      try {
        const r = await dispatchOne(p, guidance);
        reasons[r.reason || 'UNKNOWN'] = (reasons[r.reason || 'UNKNOWN'] || 0) + 1;
        if (r.ok) dispatched++;
        else if (r.reason === 'NO_GUIDANCE_TODAY' || r.reason?.startsWith('NO_')) skipped++;
        else errors++;
      } catch (e) {
        console.error('[daily-guidance] dispatchOne crashed', { user: p.id, err: (e as Error).message });
        errors++;
      }
    }

    offset += BATCH_SIZE;

    // Garde-fou temps d'exécution Netlify (10s sur free, 26s background)
    if (Date.now() - startedAt > 8500) {
      console.warn('[daily-guidance] time budget reached, stopping early');
      break;
    }
  }

  const elapsed = Date.now() - startedAt;
  console.log('[daily-guidance] done', { total, dispatched, skipped, errors, reasons, elapsedMs: elapsed });
  return {
    statusCode: 200,
    body: JSON.stringify({ total, dispatched, skipped, errors, reasons, elapsedMs: elapsed }),
  };
};

export { handler };
