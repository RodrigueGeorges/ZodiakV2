import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import { computeNatalChart, computeDailyTransitsLocal } from './_astroEngine.js';

/**
 * Endpoint de calcul astrologique — 100% local via `astronomy-engine`.
 *
 * ⚠️ Anciennement basé sur Prokerala (API payante, latence réseau). Migré
 * en mai 2026 vers un calcul local : 0 € de runtime, ~5 ms de latence,
 * précision arc-minute. Voir `_astroEngine.ts` pour les détails.
 *
 * Body attendu :
 *   {
 *     type: 'natal_chart' | 'transits',
 *     birthDate: 'YYYY-MM-DD',
 *     birthTime: 'HH:MM' (optionnel pour transits, requis pour natal_chart),
 *     birthPlace: 'lat,lng'  // ex: '48.8566,2.3522'
 *   }
 *
 * Retour :
 *   - natal_chart : { planets: [...], houses: [...], ascendant: {...} }
 *   - transits    : { planets: [...] }
 *
 * Le format de réponse reste compatible avec ce que `src/lib/astrology.ts`
 * attend (transformNatalChart côté client), pour ne casser aucune intégration.
 */

interface AstrologyRequest {
  type: 'natal_chart' | 'transits';
  birthDate: string;
  birthTime?: string;
  birthPlace?: string;
  date?: string;
}

const SIGN_EN_FROM_FR: Record<string, string> = {
  Bélier: 'Aries',
  Taureau: 'Taurus',
  Gémeaux: 'Gemini',
  Cancer: 'Cancer',
  Lion: 'Leo',
  Vierge: 'Virgo',
  Balance: 'Libra',
  Scorpion: 'Scorpio',
  Sagittaire: 'Sagittarius',
  Capricorne: 'Capricorn',
  Verseau: 'Aquarius',
  Poissons: 'Pisces',
};

function parseLatLng(input: string): { latitude: number; longitude: number } | null {
  const parts = input.split(',').map((s) => s.trim());
  if (parts.length !== 2) return null;
  const [lat, lng] = parts.map((s) => parseFloat(s));
  if (isNaN(lat) || isNaN(lng)) return null;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return { latitude: lat, longitude: lng };
}

export const handler: Handler = async (event) => {
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
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const request: AstrologyRequest = JSON.parse(event.body || '{}');

    // ── Branche transits (cron daily, page guidance) ────────────────
    if (request.type === 'transits') {
      const dateIso = request.date ?? request.birthDate ?? new Date().toISOString().split('T')[0];
      const transits = computeDailyTransitsLocal(dateIso);
      // Format compatible avec l'ancien shape Prokerala : { planets: [...] }
      const planetsArray = Object.entries(transits).map(([name, p]) => ({
        name: capitalize(name),
        sign: p.sign,
        sign_en: SIGN_EN_FROM_FR[p.sign] ?? p.sign,
        degree: Math.round(p.degree * 100) / 100,
        longitude: Math.round(p.longitude * 100) / 100,
        retrograde: p.retrograde,
        is_retrograde: String(p.retrograde),
        house: 0,
      }));
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          date: dateIso,
          planets: planetsArray,
        }),
      };
    }

    // ── Branche natal_chart ────────────────────────────────────────
    if (!request.birthDate || !request.birthTime || !request.birthPlace) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Missing required fields',
          details: 'birthDate, birthTime et birthPlace sont requis',
        }),
      };
    }
    const coords = parseLatLng(request.birthPlace);
    if (!coords) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Invalid birthPlace format',
          details: 'Attendu : "latitude,longitude" — ex: "48.8566,2.3522"',
        }),
      };
    }

    // Cache Supabase : si on retrouve un profil avec le même triplet
    // naissance, on lui renvoie son thème déjà calculé (gain de ~20 ms +
    // évite de recalculer à chaque rerun en cas de retry).
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (supabaseUrl && supabaseServiceKey) {
      try {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, natal_chart')
          .eq('birth_date', request.birthDate)
          .eq('birth_time', request.birthTime)
          .eq('birth_place', request.birthPlace)
          .limit(1);
        if (profiles && profiles.length > 0 && profiles[0].natal_chart) {
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify(profiles[0].natal_chart),
          };
        }
      } catch (cacheErr) {
        // On log mais on continue — cache miss n'est pas fatal
        console.warn('Cache lookup failed:', cacheErr);
      }
    }

    // Calcul du thème natal (local)
    const isoBirth = `${request.birthDate}T${request.birthTime}:00Z`;
    const chart = computeNatalChart(isoBirth, coords.latitude, coords.longitude);

    // Format de retour compatible avec `transformNatalChart` côté client.
    // Le client attend : { planets: [{name, longitude, house, sign, is_retrograde}],
    //                     houses: [{house_number, sign, degree}],
    //                     ascendant: {sign, degree} }
    const response = {
      planets: [
        formatPlanet('Soleil', chart.sun),
        formatPlanet('Lune', chart.moon),
        formatPlanet('Mercure', chart.mercury),
        formatPlanet('Vénus', chart.venus),
        formatPlanet('Mars', chart.mars),
        formatPlanet('Jupiter', chart.jupiter),
        formatPlanet('Saturne', chart.saturn),
      ],
      houses: chart.houses.map((h, i) => ({
        house_number: i + 1,
        sign: h.sign,
        degree: Math.round(h.degree * 100) / 100,
      })),
      ascendant: {
        sign: chart.ascendant.sign,
        degree: Math.round(chart.ascendant.degree * 100) / 100,
      },
      midheaven: {
        sign: chart.midheaven.sign,
        degree: Math.round(chart.midheaven.degree * 100) / 100,
      },
      // Aussi l'ancien format pour compatibilité
      sun: chart.sun,
      moon: chart.moon,
      mercury: chart.mercury,
      venus: chart.venus,
      mars: chart.mars,
      jupiter: chart.jupiter,
      saturn: chart.saturn,
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response),
    };
  } catch (error) {
    console.error('Astrology endpoint error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};

function formatPlanet(
  nameFr: string,
  p: { sign: string; degree: number; longitude: number; retrograde: boolean; house?: number },
) {
  return {
    name: nameFr,
    sign: p.sign,
    sign_en: SIGN_EN_FROM_FR[p.sign] ?? p.sign,
    degree: Math.round(p.degree * 100) / 100,
    longitude: Math.round(p.longitude * 100) / 100,
    house: p.house ?? 0,
    retrograde: p.retrograde,
    is_retrograde: String(p.retrograde),
  };
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
