import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import {
  sendWhatsAppTemplate,
  sendInstagramText,
  buildGuidanceShortLink,
  getMetaConfig,
  type Channel,
} from './_metaUtils';

/**
 * Endpoint admin pour tester un envoi WhatsApp/Instagram sans attendre le cron.
 *
 * Sécurité :
 *   - Réservé aux admins listés dans `process.env.ADMIN_EMAILS` (CSV).
 *   - Le caller doit fournir un JWT Supabase valide en header `Authorization`.
 *   - Le JWT est vérifié contre le projet Supabase pour récupérer l'email du user.
 *
 * Body POST attendu :
 *   {
 *     "userId": "uuid",                  // user à qui envoyer
 *     "channel": "whatsapp" | "instagram",
 *     "mode": "template" | "text",       // template = HSM, text = fenêtre 24h
 *     "text"?: "string"                  // requis si mode=text
 *   }
 *
 * Variables d'env :
 *   - ADMIN_EMAILS = "alice@x.com,bob@x.com"
 *   - SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *   - WHATSAPP_*, INSTAGRAM_* (cf. _metaUtils.getMetaConfig)
 */

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface AuthedUser {
  id: string;
  email: string;
}

async function authenticateAdmin(authHeader: string | undefined): Promise<AuthedUser | null> {
  if (!authHeader || !authHeader.toLowerCase().startsWith('bearer ')) return null;
  const jwt = authHeader.slice('bearer '.length).trim();
  if (!jwt) return null;

  const { data, error } = await supabase.auth.getUser(jwt);
  if (error || !data.user?.email) return null;

  const adminEmails = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (adminEmails.length === 0) return null;
  if (!adminEmails.includes(data.user.email.toLowerCase())) return null;

  return { id: data.user.id, email: data.user.email };
}

interface ProfileRow {
  id: string;
  name: string | null;
  preferred_channel: Channel | null;
  whatsapp_wa_id: string | null;
  instagram_igsid: string | null;
}

const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const admin = await authenticateAdmin(
    event.headers['authorization'] || event.headers['Authorization']
  );
  if (!admin) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  let body: { userId?: string; channel?: Channel; mode?: 'template' | 'text'; text?: string };
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Bad JSON' }) };
  }
  const { userId, channel, mode = 'text', text } = body;
  if (!userId || !channel) {
    return { statusCode: 400, body: JSON.stringify({ error: 'userId and channel required' }) };
  }

  const { data: profile, error: profileErr } = await supabase
    .from('profiles')
    .select('id, name, preferred_channel, whatsapp_wa_id, instagram_igsid')
    .eq('id', userId)
    .maybeSingle<ProfileRow>();
  if (profileErr || !profile) {
    return { statusCode: 404, body: JSON.stringify({ error: 'Profile not found' }) };
  }

  const target =
    channel === 'whatsapp' ? profile.whatsapp_wa_id : profile.instagram_igsid;
  if (!target) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: `User has no ${channel} id configured` }),
    };
  }

  const cfg = getMetaConfig();
  const firstName = profile.name?.split(' ')[0] ?? 'cher utilisateur';
  const messageText = text || `✦ ${firstName}, ceci est un test depuis Zodiak admin.`;

  let result;
  if (channel === 'whatsapp' && mode === 'template') {
    // Test template avec un faux short_code (la doc Meta limite ce qu'on peut
    // envoyer hors fenêtre 24h, donc en mode test on envoie à un short_code "TEST")
    const shortCode = 'TEST00';
    result = await sendWhatsAppTemplate({
      to: target,
      templateName: cfg.guidanceTemplateName,
      languageCode: cfg.guidanceTemplateLang,
      bodyParams: [{ text: firstName }, { text: buildGuidanceShortLink(shortCode) }],
      buttonUrlSuffix: shortCode,
    });
  } else if (channel === 'whatsapp') {
    const { sendWhatsAppText } = await import('./_metaUtils');
    result = await sendWhatsAppText(target, messageText);
  } else {
    result = await sendInstagramText({ to: target, text: messageText, messagingType: 'RESPONSE' });
  }

  // Logguer le test dans message_log
  await supabase.from('message_log').insert({
    user_id: userId,
    channel,
    direction: 'outbound',
    message_type: mode === 'template' ? 'template' : 'text',
    template_name: mode === 'template' ? cfg.guidanceTemplateName : null,
    provider_message_id: result.providerMessageId ?? null,
    payload: { admin_test: true, by: admin.email, raw: result.raw } as Record<string, unknown>,
    sent_at: new Date().toISOString(),
    failed_at: result.ok ? null : new Date().toISOString(),
    error_code: result.errorCode ?? null,
    error_message: result.errorMessage ?? null,
  });

  return {
    statusCode: result.ok ? 200 : 500,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(result),
  };
};

export { handler };
