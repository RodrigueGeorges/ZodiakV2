/**
 * Helpers WhatsApp Cloud API + Instagram Messaging API (Meta Graph API).
 *
 * Doc :
 *  - https://developers.facebook.com/docs/whatsapp/cloud-api
 *  - https://developers.facebook.com/docs/messenger-platform/instagram
 *  - https://developers.facebook.com/docs/graph-api/webhooks/getting-started
 *
 * Toutes les fonctions ici sont SERVEUR uniquement. Aucune clé Meta ne doit
 * jamais finir dans le bundle client (pas de `VITE_*`).
 */

import crypto from 'crypto';

// ─────────────────────────────────────────────────────────────────────────────
// Types publics
// ─────────────────────────────────────────────────────────────────────────────

export type Channel = 'whatsapp' | 'instagram';

export interface SendResult {
  ok: boolean;
  channel: Channel;
  providerMessageId?: string;
  errorCode?: string;
  errorMessage?: string;
  raw?: unknown;
}

export interface WhatsAppTemplateParam {
  /** Texte qui remplace `{{1}}`, `{{2}}`… dans le template approuvé. */
  text: string;
}

export interface SendWhatsAppTemplateOptions {
  /** Numéro destinataire au format E.164 sans le "+", ex: "33612345678". */
  to: string;
  templateName: string;
  /** Code langue du template approuvé (ex: "fr", "fr_FR", "en_US"). */
  languageCode: string;
  bodyParams: WhatsAppTemplateParam[];
  /**
   * Optionnel : URL/code pour un bouton dynamique (URL button avec `{{1}}`).
   * Permet par exemple d'injecter le short_code de la guidance du jour.
   */
  buttonUrlSuffix?: string;
}

export interface SendInstagramTextOptions {
  /** Instagram-scoped user ID (igsid) du destinataire. */
  to: string;
  text: string;
  /** RECOMMANDÉ pour push hors fenêtre 24h. */
  messagingType?: 'RESPONSE' | 'UPDATE' | 'MESSAGE_TAG';
  /** Tag Meta pour push hors fenêtre — ex: "HUMAN_AGENT", "ACCOUNT_UPDATE". */
  tag?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Configuration (lecture env, validation)
// ─────────────────────────────────────────────────────────────────────────────

const GRAPH_VERSION = process.env.META_GRAPH_VERSION || 'v21.0';
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_VERSION}`;

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Variable d'environnement manquante : ${name}`);
  return v;
}

export function getMetaConfig() {
  return {
    appSecret: process.env.META_APP_SECRET,
    verifyToken: process.env.META_VERIFY_TOKEN,

    waPhoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    waBusinessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID,
    waAccessToken: process.env.WHATSAPP_ACCESS_TOKEN,

    igPageAccessToken: process.env.INSTAGRAM_PAGE_ACCESS_TOKEN,
    igBusinessId: process.env.INSTAGRAM_BUSINESS_ID,

    guidanceTemplateName: process.env.META_GUIDANCE_TEMPLATE_NAME || 'guidance_quotidienne',
    guidanceTemplateLang: process.env.META_GUIDANCE_TEMPLATE_LANG || 'fr',

    appUrl:
      process.env.URL ||
      process.env.DEPLOY_PRIME_URL ||
      'https://zodiakastro.com',
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Sécurité webhook : vérification de signature Meta
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Vérifie l'en-tête `X-Hub-Signature-256` reçu sur les webhooks Meta.
 * Meta calcule HMAC-SHA256(appSecret, rawBody) et l'envoie en hex préfixé "sha256=".
 *
 * IMPORTANT : on doit utiliser le `rawBody` exact reçu (string), pas le JSON
 * re-stringifié. Netlify expose `event.body` brut quand le `Content-Type` est
 * `application/json`.
 */
export function verifyMetaSignature(rawBody: string, signatureHeader: string | undefined): boolean {
  const { appSecret } = getMetaConfig();
  if (!appSecret) {
    console.error('[meta] META_APP_SECRET non configuré → webhook NON vérifiable');
    return false;
  }
  if (!signatureHeader) return false;

  const expectedRaw = signatureHeader.startsWith('sha256=')
    ? signatureHeader.slice('sha256='.length)
    : signatureHeader;

  const computed = crypto
    .createHmac('sha256', appSecret)
    .update(rawBody, 'utf8')
    .digest('hex');

  // Comparaison à temps constant
  const a = Buffer.from(computed, 'hex');
  const b = Buffer.from(expectedRaw, 'hex');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/**
 * Handler du flow GET de vérification webhook Meta (challenge).
 * À appeler depuis le handler de meta-webhook.ts pour les requêtes GET.
 */
export function handleVerify(query: Record<string, string | undefined>) {
  const mode = query['hub.mode'];
  const token = query['hub.verify_token'];
  const challenge = query['hub.challenge'];
  const { verifyToken } = getMetaConfig();

  if (mode === 'subscribe' && token && verifyToken && token === verifyToken && challenge) {
    return { statusCode: 200, body: challenge };
  }
  return { statusCode: 403, body: 'Forbidden' };
}

// ─────────────────────────────────────────────────────────────────────────────
// Envoi WhatsApp (template HSM)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Envoie un message WhatsApp basé sur un Template approuvé par Meta.
 *
 * Pour les pushes proactifs hors fenêtre 24h (cas de la guidance quotidienne),
 * c'est obligatoirement via un Message Template (HSM) en catégorie Marketing
 * ou Utility, validé en amont dans WhatsApp Manager.
 */
export async function sendWhatsAppTemplate(
  opts: SendWhatsAppTemplateOptions
): Promise<SendResult> {
  const { waPhoneNumberId, waAccessToken } = getMetaConfig();
  if (!waPhoneNumberId || !waAccessToken) {
    return {
      ok: false,
      channel: 'whatsapp',
      errorCode: 'CONFIG_MISSING',
      errorMessage: 'WHATSAPP_PHONE_NUMBER_ID ou WHATSAPP_ACCESS_TOKEN manquant',
    };
  }

  const components: Array<Record<string, unknown>> = [];

  if (opts.bodyParams.length > 0) {
    components.push({
      type: 'body',
      parameters: opts.bodyParams.map((p) => ({ type: 'text', text: p.text })),
    });
  }

  if (opts.buttonUrlSuffix) {
    components.push({
      type: 'button',
      sub_type: 'url',
      index: '0',
      parameters: [{ type: 'text', text: opts.buttonUrlSuffix }],
    });
  }

  const body = {
    messaging_product: 'whatsapp',
    to: opts.to,
    type: 'template',
    template: {
      name: opts.templateName,
      language: { code: opts.languageCode },
      components,
    },
  };

  try {
    const res = await fetch(`${GRAPH_BASE}/${waPhoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${waAccessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;

    if (!res.ok) {
      const err = (json.error as Record<string, unknown> | undefined) || {};
      return {
        ok: false,
        channel: 'whatsapp',
        errorCode: String(err.code ?? res.status),
        errorMessage: String(err.message ?? `HTTP ${res.status}`),
        raw: json,
      };
    }

    const messages = (json.messages as Array<{ id: string }> | undefined) || [];
    return {
      ok: true,
      channel: 'whatsapp',
      providerMessageId: messages[0]?.id,
      raw: json,
    };
  } catch (e) {
    return {
      ok: false,
      channel: 'whatsapp',
      errorCode: 'NETWORK',
      errorMessage: e instanceof Error ? e.message : String(e),
    };
  }
}

/** Envoi WhatsApp en texte libre — UNIQUEMENT dans la fenêtre 24h post-message du user. */
export async function sendWhatsAppText(to: string, text: string): Promise<SendResult> {
  const { waPhoneNumberId, waAccessToken } = getMetaConfig();
  if (!waPhoneNumberId || !waAccessToken) {
    return {
      ok: false,
      channel: 'whatsapp',
      errorCode: 'CONFIG_MISSING',
      errorMessage: 'Config WhatsApp manquante',
    };
  }

  try {
    const res = await fetch(`${GRAPH_BASE}/${waPhoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${waAccessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body: text },
      }),
    });
    const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) {
      const err = (json.error as Record<string, unknown> | undefined) || {};
      return {
        ok: false,
        channel: 'whatsapp',
        errorCode: String(err.code ?? res.status),
        errorMessage: String(err.message ?? `HTTP ${res.status}`),
        raw: json,
      };
    }
    const messages = (json.messages as Array<{ id: string }> | undefined) || [];
    return {
      ok: true,
      channel: 'whatsapp',
      providerMessageId: messages[0]?.id,
      raw: json,
    };
  } catch (e) {
    return {
      ok: false,
      channel: 'whatsapp',
      errorCode: 'NETWORK',
      errorMessage: e instanceof Error ? e.message : String(e),
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Envoi Instagram Direct
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Envoie un message texte Instagram à un user via son `igsid`.
 *
 * IMPORTANT : pour push hors fenêtre 24h, il faut soit :
 *   - un MESSAGE_TAG approuvé (HUMAN_AGENT, ACCOUNT_UPDATE…),
 *   - soit avoir activé Recurring Notifications (opt-in user explicite).
 * Pour la guidance quotidienne, le pattern recommandé est :
 *   1. user DM "START" / clique sur l'opt-in IG → on enregistre l'igsid
 *   2. on lui envoie un quick-reply de demande de Recurring Notifications
 *   3. après opt-in, push quotidien autorisé sur la fréquence souscrite
 */
export async function sendInstagramText(opts: SendInstagramTextOptions): Promise<SendResult> {
  const { igPageAccessToken, igBusinessId } = getMetaConfig();
  if (!igPageAccessToken || !igBusinessId) {
    return {
      ok: false,
      channel: 'instagram',
      errorCode: 'CONFIG_MISSING',
      errorMessage: 'INSTAGRAM_PAGE_ACCESS_TOKEN ou INSTAGRAM_BUSINESS_ID manquant',
    };
  }

  const payload: Record<string, unknown> = {
    recipient: { id: opts.to },
    message: { text: opts.text },
    messaging_type: opts.messagingType ?? 'RESPONSE',
  };
  if (opts.tag) payload.tag = opts.tag;

  try {
    const res = await fetch(`${GRAPH_BASE}/${igBusinessId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${igPageAccessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) {
      const err = (json.error as Record<string, unknown> | undefined) || {};
      return {
        ok: false,
        channel: 'instagram',
        errorCode: String(err.code ?? res.status),
        errorMessage: String(err.message ?? `HTTP ${res.status}`),
        raw: json,
      };
    }
    return {
      ok: true,
      channel: 'instagram',
      providerMessageId: (json.message_id as string) || undefined,
      raw: json,
    };
  } catch (e) {
    return {
      ok: false,
      channel: 'instagram',
      errorCode: 'NETWORK',
      errorMessage: e instanceof Error ? e.message : String(e),
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers de normalisation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Normalise un numéro de téléphone vers le format Meta (E.164 sans le "+").
 * Ex: "+33 6 12 34 56 78" → "33612345678"
 *     "06 12 34 56 78"   → "33612345678"  (par défaut FR)
 */
export function toMetaPhoneFormat(input: string, defaultCountryCode = '33'): string {
  const digits = input.replace(/\D/g, '');
  if (!digits) return '';
  // 0XXXXXXXXX → +33XXXXXXXXX
  if (digits.startsWith('0') && digits.length === 10) {
    return `${defaultCountryCode}${digits.slice(1)}`;
  }
  // Déjà sans "+", à priori OK
  return digits;
}

/**
 * Construit le lien court de guidance depuis le short_code et l'URL Netlify.
 */
export function buildGuidanceShortLink(shortCode: string): string {
  const { appUrl } = getMetaConfig();
  return `${appUrl}/g/${shortCode}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Export utilitaire requireEnv (utile dans meta-webhook au boot)
// ─────────────────────────────────────────────────────────────────────────────
export { requireEnv };
