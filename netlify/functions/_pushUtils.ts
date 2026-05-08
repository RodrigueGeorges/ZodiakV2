/**
 * Utilitaires Web Push (VAPID + envoi via web-push).
 *
 * web-push n'est pas installé par défaut — il sera ajouté à la racine via
 * `npm install web-push`. On charge dynamiquement pour permettre aux fonctions
 * qui n'envoient PAS de push de ne pas le requérir au build.
 */

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  icon?: string;
  badge?: string;
  image?: string;
  tag?: string;
  renotify?: boolean;
  data?: Record<string, unknown>;
}

interface SubscriptionRow {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

let webpush: typeof import('web-push') | null = null;

async function loadWebPush() {
  if (webpush) return webpush;
  try {
    // @ts-expect-error - chargé dynamiquement (peut ne pas être installé en preview)
    const mod = (await import('web-push')) as typeof import('web-push');
    const pub = process.env.VAPID_PUBLIC_KEY;
    const priv = process.env.VAPID_PRIVATE_KEY;
    const subject = process.env.VAPID_SUBJECT || 'mailto:contact@zodiak.app';
    if (!pub || !priv) {
      throw new Error('VAPID keys missing (VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY)');
    }
    mod.setVapidDetails(subject, pub, priv);
    webpush = mod;
    return mod;
  } catch (err) {
    console.error('[push] web-push module not loaded:', err);
    throw err;
  }
}

export interface SendResult {
  ok: boolean;
  status?: number;
  error?: string;
  shouldRemove?: boolean;
}

/**
 * Envoie un payload à une subscription. Renvoie shouldRemove=true si la
 * subscription est expirée (404/410) — l'appelant doit la supprimer en DB.
 */
export async function sendPush(
  sub: SubscriptionRow,
  payload: PushPayload
): Promise<SendResult> {
  const wp = await loadWebPush();

  try {
    const res = await wp.sendNotification(
      {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth },
      },
      JSON.stringify(payload),
      { TTL: 60 * 60 * 12 }
    );
    return { ok: true, status: res.statusCode };
  } catch (err: unknown) {
    const e = err as { statusCode?: number; body?: string; message?: string };
    const status = e.statusCode ?? 0;
    const shouldRemove = status === 404 || status === 410;
    return {
      ok: false,
      status,
      error: e.body || e.message || 'unknown',
      shouldRemove,
    };
  }
}
