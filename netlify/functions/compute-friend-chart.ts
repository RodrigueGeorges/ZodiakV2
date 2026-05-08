import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import { computeNatalChart } from './_astroEngine';

/**
 * Calcule la carte natale d'un "friend" (proche, partenaire) renseigné par
 * l'utilisateur. Géocodage simple via les champs déjà saisis (lat/lon
 * peuvent être 0/0 si on n'a pas de précision — la carte aura une marge
 * d'erreur sur l'Asc, mais le Soleil/Lune restent corrects).
 *
 * Auth : Bearer JWT Supabase.
 *
 * Input  : { name, birth_date, birth_time, birth_place, latitude, longitude,
 *            relationship?, avatar_emoji? }
 * Output : { friend: Friend, synastry?: { score, aspects, summary } }
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
    name: string;
    birth_date: string;
    birth_time?: string;
    birth_place?: string;
    latitude?: number;
    longitude?: number;
    relationship?: string;
    avatar_emoji?: string;
  };
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, body: 'Invalid JSON' };
  }

  if (!body.name || !body.birth_date) {
    return { statusCode: 400, body: 'Missing required fields' };
  }

  const supa = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: userResp, error: authErr } = await supa.auth.getUser();
  if (authErr || !userResp.user) {
    return { statusCode: 401, body: 'Invalid session' };
  }

  // Construit l'ISO de naissance — fallback midi UTC si pas d'heure.
  const birthIso = body.birth_time
    ? `${body.birth_date}T${body.birth_time}:00Z`
    : `${body.birth_date}T12:00:00Z`;

  let chart;
  try {
    chart = computeNatalChart(birthIso, body.latitude ?? 0, body.longitude ?? 0);
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'chart computation failed', detail: String(err) }),
    };
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chart, birth_iso: birthIso }),
  };
};

export { handler };
