import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

/**
 * Endpoint REST de fallback pour persister un PushSubscription côté serveur.
 * Le hook `usePushNotifications` écrit déjà directement via supabase-js
 * (RLS owner), mais cet endpoint est utile pour les contextes où on veut
 * passer par un JWT propre (extensions, app native plus tard, debug curl).
 *
 * Auth : Bearer JWT Supabase (pas de service_role exposé).
 */
const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const auth = event.headers.authorization || event.headers.Authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return { statusCode: 401, body: 'Missing bearer token' };
  }
  const token = auth.replace(/^Bearer\s+/i, '');

  let body: {
    endpoint: string;
    keys?: { p256dh?: string; auth?: string };
  };
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, body: 'Invalid JSON' };
  }

  if (!body.endpoint || !body.keys?.p256dh || !body.keys?.auth) {
    return { statusCode: 400, body: 'Missing keys' };
  }

  const supa = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data: userResp, error: userErr } = await supa.auth.getUser();
  if (userErr || !userResp.user) {
    return { statusCode: 401, body: 'Invalid session' };
  }

  const { error } = await supa.from('push_subscriptions').upsert(
    {
      user_id: userResp.user.id,
      endpoint: body.endpoint,
      p256dh: body.keys.p256dh,
      auth: body.keys.auth,
      user_agent: event.headers['user-agent'] || null,
      last_used_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,endpoint' }
  );

  if (error) {
    return { statusCode: 500, body: error.message };
  }
  return { statusCode: 200, body: JSON.stringify({ ok: true }) };
};

export { handler };
