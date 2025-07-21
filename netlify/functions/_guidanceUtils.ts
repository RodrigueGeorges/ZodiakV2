import { createClient } from '@supabase/supabase-js';
import { toZonedTime, format } from 'date-fns-tz';
import { randomUUID } from 'crypto';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

const TIMEZONE = 'Europe/Paris';
const TOKEN_CACHE_DURATION = 50 * 60 * 1000; // 50 minutes
// Correction typage :
let prokeralaTokenCache: { token: string; expiresAt: number } | null = null;
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 5;

function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const limit = rateLimitMap.get(identifier);
  if (!limit || now > limit.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }
  if (limit.count >= MAX_REQUESTS_PER_WINDOW) return false;
  limit.count++;
  return true;
}

async function getProkeralaToken(): Promise<string | null> {
  try {
    if (prokeralaTokenCache && Date.now() < prokeralaTokenCache.expiresAt) {
      return prokeralaTokenCache.token;
    }
    if (!checkRateLimit('prokerala_auth')) return null;
    const clientId = process.env.PROKERALA_CLIENT_ID;
    const clientSecret = process.env.PROKERALA_CLIENT_SECRET;
    if (!clientId || !clientSecret) return null;
    const authUrl = 'https://api.prokerala.com/token';
    const tokenRes = await fetch(authUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, grant_type: 'client_credentials' }),
    });
    if (!tokenRes.ok) return null;
    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;
    if (!accessToken) return null;
    prokeralaTokenCache = { token: accessToken, expiresAt: Date.now() + TOKEN_CACHE_DURATION };
    return accessToken;
  } catch {
    return null;
  }
}

function getSimulatedTransits(date) {
  return { soleil: { sign: 'Bélier', degree: 10 }, lune: { sign: 'Taureau', degree: 20 } };
}

export async function calculateDailyTransits(date) {
  try {
    const { data: cachedTransits, error: cacheError } = await supabase
      .from('daily_transits')
      .select('transit_data')
      .eq('date', date)
      .maybeSingle();
    if (!cacheError && cachedTransits?.transit_data) return cachedTransits.transit_data;
    if (!checkRateLimit('prokerala_transits')) return getSimulatedTransits(date);
    const accessToken = await getProkeralaToken();
    if (!accessToken) return getSimulatedTransits(date);
    const baseUrl = process.env.PROKERALA_BASE_URL;
    if (!baseUrl) return getSimulatedTransits(date);
    const parisLatitude = 48.8566;
    const parisLongitude = 2.3522;
    const datetime = `${date}T12:00:00Z`;
    const prokeralaRes = await fetch(`${baseUrl}/v2/astrology/natal-chart`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ datetime, latitude: parisLatitude, longitude: parisLongitude, house_system: 'placidus', chart_type: 'western' })
    });
    if (!prokeralaRes.ok) return getSimulatedTransits(date);
    const transitData = await prokeralaRes.json();
    const transits = {};
    if (transitData.planets && Array.isArray(transitData.planets)) {
      transitData.planets.forEach((planet) => {
        if (planet.name && planet.sign) {
          transits[planet.name.toLowerCase()] = { sign: planet.sign, degree: planet.longitude || 0 };
        }
      });
    }
    return transits;
  } catch {
    return getSimulatedTransits(date);
  }
}

function getDefaultGuidance() {
  return {
    summary: "Les aspects planétaires du jour vous invitent à l'action réfléchie. Restez à l'écoute de votre intuition tout en avançant avec détermination vers vos objectifs.",
    love: { text: "Vénus forme des aspects harmonieux qui favorisent les échanges authentiques. C'est le moment d'exprimer vos sentiments avec sincérité et d'ouvrir votre coeur à de nouvelles connexions.", score: 75 },
    work: { text: "Mercure soutient vos projets professionnels. Votre clarté d'esprit est un atout majeur aujourd'hui. Profitez de cette énergie pour communiquer vos idées et prendre des initiatives constructives.", score: 80 },
    energy: { text: "L'alignement des planètes vous apporte une belle vitalité. C'est une excellente journée pour démarrer de nouvelles activités physiques ou pour vous consacrer à des projets qui vous passionnent.", score: 70 },
    mantra: "Je m'ouvre aux belles surprises de l'univers et j'avance avec confiance."
  };
}

export async function generateGuidanceWithOpenAI(natalChart, transits, date) {
  try {
    const cacheKey = `guidance_${date}_${JSON.stringify(natalChart.planets?.map(p => `${p.name}${p.sign}${p.house}`)).slice(0, 100)}_${JSON.stringify(transits).slice(0, 100)}`;
    const { data: cachedGuidance, error: cacheError } = await supabase
      .from('guidance_cache')
      .select('guidance_data')
      .eq('cache_key', cacheKey)
      .maybeSingle();
    if (!cacheError && cachedGuidance?.guidance_data) return cachedGuidance.guidance_data;
    if (!checkRateLimit('openai_guidance')) return getDefaultGuidance();
    const prompt = `
Tu es un astrologue expert, créatif, inspirant et moderne, qui rédige des guidances quotidiennes pour une application de guidance astrologique personnalisée.

Ta mission :
- Génère une guidance du jour profonde, nuancée, innovante et personnalisée, basée sur le thème natal (fourni) et les transits planétaires du jour (fournis).
- Utilise un ton riche, imagé, parfois poétique ou philosophique, sans jargon technique inaccessible.
- N’hésite pas à utiliser des métaphores, des références à la mythologie, à la littérature, ou à la culture populaire pour illustrer tes conseils.
- Propose des conseils concrets, mais aussi des réflexions ou des inspirations qui invitent à la prise de recul.
- Structure la réponse en 4 parties :
  1. Résumé général (2-3 phrases, synthétique, engageant, mais profond)
  2. Amour : conseil nuancé, imagé, parfois symbolique, avec un score sur 100
  3. Travail : conseil pratique, mais aussi visionnaire ou inspirant, avec un score sur 100
  4. Bien-être/Énergie : conseil pour l’équilibre personnel, ouvert à la spiritualité, la nature, la créativité, avec un score sur 100
- Termine par un mantra du jour ou une inspiration courte, originale, qui peut être une citation, un proverbe, ou une création de ton cru.
- Sois créatif, pertinent, et évite toute répétition ou banalité.
- Varie le style chaque jour (parfois poétique, parfois philosophique, parfois humoristique, parfois mystérieux).

Format de réponse JSON attendu :
{
  "summary": "Résumé général du jour, profond et engageant.",
  "love": { "text": "Conseil amour nuancé et imagé.", "score": 0-100 },
  "work": { "text": "Conseil travail inspirant et concret.", "score": 0-100 },
  "energy": { "text": "Conseil bien-être original et subtil.", "score": 0-100 },
  "mantra": "Mantra, citation ou inspiration du jour."
}

Données à utiliser :
- Thème natal : ${JSON.stringify(natalChart, null, 2)}
- Transits du jour : ${JSON.stringify(transits, null, 2)}

Exemple de ton attendu :
- "Aujourd'hui, une brise nouvelle souffle sur ton destin, t'invitant à explorer des terres intérieures inexplorées."
- "Côté amour, laisse parler ton cœur comme un poète sous la lune..."
- "Au travail, ose rêver grand, car les étoiles favorisent les audacieux..."
- "Ton énergie est une rivière : parfois paisible, parfois impétueuse, mais toujours vivante."
- "Mantra : 'Comme le phénix, je me régénère à chaque aube.'"

Génère la guidance du jour selon ce format et ce ton.`;
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview',
        messages: [{ role: 'system', content: 'Tu es un astrologue expert.' }, { role: 'user', content: prompt }],
        max_tokens: 400,
        temperature: 0.7,
        response_format: { type: 'json_object' },
      })
    });
    if (!response.ok) return getDefaultGuidance();
    const data = await response.json();
    const guidance = JSON.parse(data.choices[0].message.content);
    if (guidance && guidance.summary && guidance.love && guidance.work && guidance.energy) {
      try {
        await supabase
          .from('guidance_cache')
          .upsert({
            cache_key: cacheKey,
            guidance_data: guidance,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
      } catch {}
    }
    return guidance;
  } catch {
    return getDefaultGuidance();
  }
}

export async function sendSms(phone, guidance, name) {
  const appUrl = process.env.URL || 'https://zodiak.netlify.app';
  const smsContent = `✨ Bonjour ${name?.split(' ')[0] || 'cher utilisateur'} !\n\nDécouvre ta guidance du jour ! 🌟\n${guidance.summary}\n\n💖 Amour : ${guidance.love.text}\n💼 Travail : ${guidance.work.text}\n⚡ Énergie : ${guidance.energy.text}\n\nMantra : ${guidance.mantra}\n\nZodiak - Ton guide astral quotidien`;
  const response = await fetch(`${appUrl}/.netlify/functions/send-sms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, message: smsContent, from: 'Zodiak' })
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Erreur SMS: ${errorData.error || 'Envoi SMS échoué'}`);
  }
} 