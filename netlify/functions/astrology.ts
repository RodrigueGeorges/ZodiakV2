import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

interface AstrologyRequest {
  type: 'natal_chart' | 'transits';
  birthDate: string;
  birthTime: string;
  birthPlace: string;
}

interface Planet {
  name: string;
  longitude: number;
  house: number;
  sign: string;
  retrograde: boolean;
}

interface House {
  number: number;
  sign: string;
  degree: number;
}

interface Ascendant {
  sign: string;
  degree: number;
}

interface NatalChart {
  planets: Planet[];
  houses: House[];
  ascendant: Ascendant;
}

// Cache simple côté serveur (en mémoire)
const serverCache = new Map<string, { data: NatalChart; timestamp: number }>();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 heures

function getFromCache(key: string): NatalChart | null {
  const cached = serverCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    // console.log('✅ Cache hit for key:', key);
    return cached.data;
  }
  if (cached) {
    serverCache.delete(key); // Expiré
  }
  return null;
}

function setInCache(key: string, data: NatalChart): void {
  serverCache.set(key, {
    data,
    timestamp: Date.now()
  });
  // console.log('💾 Cached data for key:', key);
}

export const handler: Handler = async (event, _context): Promise<any> => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const request: AstrologyRequest = JSON.parse(event.body || '{}');
    if (!request.birthDate || !request.birthTime || !request.birthPlace) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing required fields' }) };
    }

    // --- SUPABASE ---
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseServiceKey) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Supabase config missing' }) };
    }
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Vérifier si le thème natal existe déjà (on suppose un profil unique par triplet naissance)
    const { data: profiles, error: supaErr } = await supabase
      .from('profiles')
      .select('id, natal_chart')
      .eq('birth_date', request.birthDate)
      .eq('birth_time', request.birthTime)
      .eq('birth_place', request.birthPlace)
      .limit(1);
    if (supaErr) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Supabase error', details: supaErr.message }) };
    }
    if (profiles && profiles.length > 0 && profiles[0].natal_chart) {
      return { statusCode: 200, headers, body: JSON.stringify(profiles[0].natal_chart) };
    }

    // --- PROKERALA ---
    const baseUrl = process.env.PROKERALA_BASE_URL;
    const clientId = process.env.PROKERALA_CLIENT_ID;
    const clientSecret = process.env.PROKERALA_CLIENT_SECRET;
    if (!baseUrl || !clientId || !clientSecret) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Missing Prokerala configuration' }) };
    }
    // Authentification
    const authUrl = 'https://api.prokerala.com/token';
    const tokenRes = await fetch(authUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, grant_type: 'client_credentials' }),
    });
    if (!tokenRes.ok) {
      const errorText = await tokenRes.text();
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Failed to get access token', details: errorText }) };
    }
    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;
    if (!accessToken) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'No access token received', details: tokenData }) };
    }
    // Appel API Prokerala (POST JSON)
    const [latitude, longitude] = request.birthPlace.split(',').map(s => s.trim());
    const datetime = `${request.birthDate}T${request.birthTime}Z`;
    const prokeralaRes = await fetch(`${baseUrl}/v2/astrology/natal-chart`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        datetime,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        house_system: 'placidus',
        chart_type: 'western',
      })
    });
    if (!prokeralaRes.ok) {
      const errorText = await prokeralaRes.text();
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Astrology API error', details: errorText }) };
    }
    const natalChart = await prokeralaRes.json();
    // Stocker dans Supabase (on met à jour le premier profil trouvé ou on en crée un si besoin)
    let profileId = profiles && profiles.length > 0 ? profiles[0].id : undefined;
    if (profileId) {
      await supabase.from('profiles').update({ natal_chart: natalChart, updated_at: new Date().toISOString() }).eq('id', profileId);
    } else {
      await supabase.from('profiles').insert({
        birth_date: request.birthDate,
        birth_time: request.birthTime,
        birth_place: request.birthPlace,
        natal_chart: natalChart,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }
    return { statusCode: 200, headers, body: JSON.stringify(natalChart) };
  } catch (error) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' }) };
  }
};

async function _calculateNatalChart(data: { birthDate: string; birthTime: string; birthPlace: string }): Promise<NatalChart> {
  throw new Error('Not implemented');
}