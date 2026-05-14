import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import {
  verifyMetaSignature,
  handleVerify,
  sendWhatsAppText,
  sendInstagramText,
  type Channel,
} from './_metaUtils';

/**
 * Webhook Meta unifié (WhatsApp Cloud API + Instagram Messaging API).
 *
 * Routes :
 *   GET  /webhook/meta-webhook?hub.mode=subscribe&hub.verify_token=…&hub.challenge=…
 *        → vérification d'abonnement Meta (renvoie le challenge si verify_token OK)
 *
 *   POST /webhook/meta-webhook
 *        → événements Meta (messages entrants, statuses, opt-ins)
 *        → vérification HMAC-SHA256 obligatoire (X-Hub-Signature-256)
 *
 * Effets :
 *   - INSERT  inbound_messages    (messages entrants utilisateurs)
 *   - INSERT  message_log         (events outbound non encore loggés, opt-ins)
 *   - UPDATE  message_log         (statuses delivered / read / failed via wamid/mid)
 *   - UPDATE  profiles            (opt-in : enregistre wa_id / igsid + channel_opt_in_at)
 *
 * À configurer côté Meta :
 *   - WhatsApp : abonner aux champs `messages` (App Review Cloud API).
 *   - Instagram : abonner aux champs `messages`, `messaging_postbacks` sur
 *     l'app Meta liée à la page Facebook qui gère le compte IG Pro.
 *
 * Variables d'env requises (serveur uniquement, jamais en VITE_*) :
 *   META_APP_SECRET, META_VERIFY_TOKEN, WHATSAPP_*, INSTAGRAM_*,
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const OPT_OUT_KEYWORDS = ['stop', 'arret', 'arrêt', 'unsubscribe', 'desabonner', 'désabonner'];

/** Pattern d'un code de jumelage : 6 chiffres exactement, avec espaces optionnels. */
const PAIRING_CODE_REGEX = /\b(\d{6})\b/;

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

interface IncomingMessage {
  channel: Channel;
  providerMessageId?: string;
  conversationId?: string;
  fromId: string;        // wa_id (WA) ou igsid (IG)
  text?: string;
  username?: string;     // IG: handle utilisateur (informatif)
  timestamp?: string;
  raw: unknown;
}

interface IncomingStatus {
  channel: Channel;
  providerMessageId: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  errorCode?: string;
  errorMessage?: string;
  recipientId?: string;
  timestamp?: string;
  raw: unknown;
}

function looksLikeOptOut(text?: string): boolean {
  if (!text) return false;
  const norm = text.trim().toLowerCase();
  return OPT_OUT_KEYWORDS.some((k) => norm === k || norm.startsWith(`${k} `));
}

function extractPairingCode(text?: string): string | null {
  if (!text) return null;
  const m = text.replace(/\s+/g, ' ').match(PAIRING_CODE_REGEX);
  return m ? m[1] : null;
}

/**
 * Tente de consommer un code de jumelage. Retourne le user_id si le code est
 * valide ET non consommé ET non expiré. Atomique côté DB grâce au filtre
 * `consumed_at IS NULL` dans le UPDATE.
 */
async function consumePairingCode(code: string): Promise<string | null> {
  // 1. Lookup
  const { data: row, error } = await supabase
    .from('channel_pairing_codes')
    .select('user_id, expires_at, consumed_at')
    .eq('code', code)
    .maybeSingle();
  if (error || !row) return null;
  if (row.consumed_at) return null;
  if (new Date(row.expires_at) < new Date()) return null;

  // 2. Marquer consommé
  const { error: updErr } = await supabase
    .from('channel_pairing_codes')
    .update({ consumed_at: new Date().toISOString() })
    .eq('code', code)
    .is('consumed_at', null);
  if (updErr) return null;
  return row.user_id;
}

// ─────────────────────────────────────────────────────────────────────────────
// Parsing payload Meta
// ─────────────────────────────────────────────────────────────────────────────

interface MetaWebhookPayload {
  object?: string;
  entry?: Array<{
    id?: string;
    time?: number;
    changes?: Array<{
      field?: string;
      value?: WhatsAppChangeValue;
    }>;
    messaging?: InstagramMessagingEvent[];
  }>;
}

interface WhatsAppChangeValue {
  messaging_product?: string;
  metadata?: { display_phone_number?: string; phone_number_id?: string };
  contacts?: Array<{ profile?: { name?: string }; wa_id?: string }>;
  messages?: Array<{
    from?: string;
    id?: string;
    timestamp?: string;
    type?: string;
    text?: { body?: string };
    button?: { text?: string; payload?: string };
    interactive?: { button_reply?: { id?: string; title?: string } };
    context?: { id?: string };
  }>;
  statuses?: Array<{
    id?: string;
    status?: string;
    timestamp?: string;
    recipient_id?: string;
    conversation?: { id?: string };
    errors?: Array<{ code?: number | string; title?: string; message?: string }>;
  }>;
}

interface InstagramMessagingEvent {
  sender?: { id?: string; username?: string };
  recipient?: { id?: string };
  timestamp?: number;
  message?: { mid?: string; text?: string; is_echo?: boolean };
  postback?: { mid?: string; payload?: string; title?: string };
  read?: { mid?: string; watermark?: number };
  delivery?: { mids?: string[]; watermark?: number };
}

function extractFromWhatsApp(payload: MetaWebhookPayload): {
  messages: IncomingMessage[];
  statuses: IncomingStatus[];
} {
  const messages: IncomingMessage[] = [];
  const statuses: IncomingStatus[] = [];

  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      const v = change.value;
      if (!v) continue;

      for (const m of v.messages ?? []) {
        if (!m.from) continue;
        const text =
          m.text?.body ??
          m.button?.text ??
          m.interactive?.button_reply?.title ??
          undefined;
        messages.push({
          channel: 'whatsapp',
          providerMessageId: m.id,
          fromId: m.from,
          text,
          timestamp: m.timestamp,
          raw: m,
        });
      }

      for (const s of v.statuses ?? []) {
        if (!s.id || !s.status) continue;
        const err = s.errors?.[0];
        statuses.push({
          channel: 'whatsapp',
          providerMessageId: s.id,
          status: s.status as IncomingStatus['status'],
          errorCode: err?.code !== undefined ? String(err.code) : undefined,
          errorMessage: err?.message ?? err?.title,
          recipientId: s.recipient_id,
          timestamp: s.timestamp,
          raw: s,
        });
      }
    }
  }
  return { messages, statuses };
}

function extractFromInstagram(payload: MetaWebhookPayload): {
  messages: IncomingMessage[];
  statuses: IncomingStatus[];
} {
  const messages: IncomingMessage[] = [];
  const statuses: IncomingStatus[] = [];

  for (const entry of payload.entry ?? []) {
    for (const ev of entry.messaging ?? []) {
      if (ev.message?.is_echo) continue;
      if (!ev.sender?.id) continue;

      if (ev.message) {
        messages.push({
          channel: 'instagram',
          providerMessageId: ev.message.mid,
          fromId: ev.sender.id,
          text: ev.message.text,
          username: ev.sender.username,
          timestamp: ev.timestamp ? String(ev.timestamp) : undefined,
          raw: ev,
        });
      } else if (ev.postback) {
        messages.push({
          channel: 'instagram',
          providerMessageId: ev.postback.mid,
          fromId: ev.sender.id,
          text: ev.postback.title ?? ev.postback.payload,
          username: ev.sender.username,
          timestamp: ev.timestamp ? String(ev.timestamp) : undefined,
          raw: ev,
        });
      } else if (ev.read?.mid) {
        statuses.push({
          channel: 'instagram',
          providerMessageId: ev.read.mid,
          status: 'read',
          recipientId: ev.recipient?.id,
          raw: ev,
        });
      } else if (ev.delivery?.mids) {
        for (const mid of ev.delivery.mids) {
          statuses.push({
            channel: 'instagram',
            providerMessageId: mid,
            status: 'delivered',
            recipientId: ev.recipient?.id,
            raw: ev,
          });
        }
      }
    }
  }
  return { messages, statuses };
}

// ─────────────────────────────────────────────────────────────────────────────
// Persistance
// ─────────────────────────────────────────────────────────────────────────────

async function findUserByChannelId(channel: Channel, fromId: string): Promise<string | null> {
  const column = channel === 'whatsapp' ? 'whatsapp_wa_id' : 'instagram_igsid';
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq(column, fromId)
    .maybeSingle();
  if (error) {
    console.warn('[meta-webhook] lookup user failed', { channel, error: error.message });
    return null;
  }
  return data?.id ?? null;
}

async function persistInboundMessage(msg: IncomingMessage) {
  const userId = await findUserByChannelId(msg.channel, msg.fromId);

  await supabase.from('inbound_messages').insert({
    user_id: userId,
    msisdn: msg.channel === 'whatsapp' ? msg.fromId : null,
    text: msg.text ?? null,
    metadata: { channel: msg.channel, raw: msg.raw },
  });

  // Et dans message_log (canal-agnostique, source de vérité moderne)
  if (userId) {
    await supabase.from('message_log').insert({
      user_id: userId,
      channel: msg.channel,
      direction: 'inbound',
      message_type: 'text',
      provider_message_id: msg.providerMessageId ?? null,
      payload: msg.raw as Record<string, unknown>,
      sent_at: msg.timestamp ? new Date(Number(msg.timestamp) * 1000).toISOString() : new Date().toISOString(),
    });
  }

  return userId;
}

async function persistStatus(s: IncomingStatus) {
  const update: Record<string, unknown> = {};
  if (s.status === 'delivered') update.delivered_at = new Date().toISOString();
  if (s.status === 'read') update.read_at = new Date().toISOString();
  if (s.status === 'failed') {
    update.failed_at = new Date().toISOString();
    update.error_code = s.errorCode ?? null;
    update.error_message = s.errorMessage ?? null;
  }
  if (Object.keys(update).length === 0) return;

  await supabase
    .from('message_log')
    .update(update)
    .eq('provider_message_id', s.providerMessageId);
}

// ─────────────────────────────────────────────────────────────────────────────
// Opt-in / Opt-out conversationnels
// ─────────────────────────────────────────────────────────────────────────────

async function reply(channel: Channel, to: string, text: string) {
  if (channel === 'whatsapp') {
    await sendWhatsAppText(to, text);
  } else {
    await sendInstagramText({ to, text });
  }
}

async function handleConversationalOptIn(msg: IncomingMessage, userId: string | null) {
  // Cas 1 : message contient un code de jumelage 6 chiffres → tentative de pairing
  const pairingCode = extractPairingCode(msg.text);
  if (pairingCode) {
    const pairedUserId = await consumePairingCode(pairingCode);
    if (pairedUserId) {
      const optInColumn = msg.channel === 'whatsapp' ? 'whatsapp_wa_id' : 'instagram_igsid';
      const update: Record<string, unknown> = {
        [optInColumn]: msg.fromId,
        preferred_channel: msg.channel,
        daily_guidance_enabled: true,
        channel_opt_in_at: new Date().toISOString(),
      };
      if (msg.channel === 'whatsapp') update.whatsapp_e164 = msg.fromId;
      if (msg.channel === 'instagram' && msg.username) update.instagram_username = msg.username;

      await supabase.from('profiles').update(update).eq('id', pairedUserId);

      const channelName = msg.channel === 'whatsapp' ? 'WhatsApp' : 'Instagram';
      await reply(
        msg.channel,
        msg.fromId,
        `✦ Parfait ! Ton compte Zodiak est maintenant lié à ${channelName}. ` +
          `Ta guidance quotidienne arrivera à l'heure que tu as choisie. ✨\n\n` +
          `Tape STOP à tout moment pour te désabonner.`
      );
      return;
    } else {
      // Code invalide / expiré
      await reply(
        msg.channel,
        msg.fromId,
        '✦ Ce code est invalide ou expiré. Génère un nouveau code dans ton profil Zodiak (valable 15 minutes).'
      );
      return;
    }
  }

  // Cas 2 : utilisateur connu et tape STOP → désabonnement
  if (userId && looksLikeOptOut(msg.text)) {
    await supabase
      .from('profiles')
      .update({ daily_guidance_enabled: false })
      .eq('id', userId);
    await reply(
      msg.channel,
      msg.fromId,
      '✦ Désabonnement bien noté. Tu peux te réabonner à tout moment depuis ton profil.'
    );
    return;
  }

  // Cas 3 : utilisateur inconnu, pas de code → onboarding
  if (!userId) {
    await reply(
      msg.channel,
      msg.fromId,
      '✦ Bienvenue ! Pour activer ta guidance quotidienne, va dans ton profil Zodiak et copie le code à 6 chiffres affiché. Envoie-le moi ici, je te connecte instantanément.'
    );
    return;
  }

  // Cas 4 : utilisateur déjà connu, message libre → ack léger
  // (à enrichir : brancher l'astro-chatbot pour répondre à des questions)
  await reply(
    msg.channel,
    msg.fromId,
    '✦ Message bien reçu. Pour gérer ton abonnement, rends-toi sur ton profil Zodiak.'
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Handler Netlify
// ─────────────────────────────────────────────────────────────────────────────

const handler: Handler = async (event) => {
  // GET = challenge de vérification d'abonnement Meta
  if (event.httpMethod === 'GET') {
    const q = (event.queryStringParameters || {}) as Record<string, string | undefined>;
    const res = handleVerify(q);
    return res;
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const rawBody = event.body ?? '';
  const sigHeader =
    event.headers['x-hub-signature-256'] ||
    event.headers['X-Hub-Signature-256'] ||
    event.headers['X-HUB-SIGNATURE-256'];

  if (!verifyMetaSignature(rawBody, sigHeader)) {
    console.warn('[meta-webhook] signature invalide → 401');
    return { statusCode: 401, body: 'Invalid signature' };
  }

  let payload: MetaWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as MetaWebhookPayload;
  } catch {
    return { statusCode: 400, body: 'Bad JSON' };
  }

  // IMPORTANT : on répond 200 le plus vite possible à Meta. Si on traîne,
  // Meta retry et duplique les events. La logique métier doit être idempotente
  // (on s'appuie sur UNIQUE(provider_message_id) côté message_log).
  try {
    const isWhatsApp = payload.object === 'whatsapp_business_account';
    const isInstagram = payload.object === 'instagram';

    const { messages, statuses } = isWhatsApp
      ? extractFromWhatsApp(payload)
      : isInstagram
      ? extractFromInstagram(payload)
      : { messages: [], statuses: [] };

    for (const s of statuses) {
      try {
        await persistStatus(s);
      } catch (e) {
        console.warn('[meta-webhook] persistStatus failed', e);
      }
    }

    for (const m of messages) {
      try {
        const userId = await persistInboundMessage(m);
        await handleConversationalOptIn(m, userId);
      } catch (e) {
        console.warn('[meta-webhook] persistInbound failed', e);
      }
    }
  } catch (e) {
    console.error('[meta-webhook] dispatch error', e);
  }

  return { statusCode: 200, body: 'EVENT_RECEIVED' };
};

export { handler };
