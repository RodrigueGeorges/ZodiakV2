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
Tu es un astrologue expert, bienveillant et moderne, qui rédige des guidances quotidiennes pour une application innovante de guidance astrologique personnalisée.

Ta mission :
- Génère une guidance du jour inspirante, actionable, innovante et personnalisée, basée sur le thème natal (fourni) et les transits planétaires du jour (fournis).
- Utilise un ton positif, motivant, accessible à tous, sans jargon technique.
- Sois créatif et INNOVANT : propose chaque jour une guidance originale, évite toute répétition ou formulation déjà utilisée précédemment.
- Structure la réponse en 4 parties :
  1. Résumé général (2 phrases max, synthétique et engageant)
  2. Amour : conseil concret et bienveillant (2-3 phrases, score sur 100)
  3. Travail : conseil pratique et motivant (2-3 phrases, score sur 100)
  4. Bien-être/Énergie : conseil pour l'équilibre personnel (2-3 phrases, score sur 100)
- Termine par un mantra du jour ou une inspiration courte, adaptée à l'énergie du jour.
- Sois créatif, mais toujours pertinent et encourageant.

Format de réponse JSON attendu :
{
  "summary": "Résumé général du jour, positif et engageant.",
  "love": { "text": "Conseil amour personnalisé.", "score": 0-100 },
  "work": { "text": "Conseil travail personnalisé.", "score": 0-100 },
  "energy": { "text": "Conseil bien-être personnalisé.", "score": 0-100 },
  "mantra": "Mantra ou inspiration du jour."
}

Données à utiliser :
- Thème natal : ${JSON.stringify(natalChart, null, 2)}
- Transits du jour : ${JSON.stringify(transits, null, 2)}

Exemple de ton attendu :
- "Aujourd'hui, une belle énergie de renouveau t'invite à oser de nouvelles choses. Profite de cette dynamique pour avancer sereinement."
- "Côté amour, exprime tes sentiments avec authenticité…"
- "Au travail, une opportunité pourrait se présenter si tu restes ouvert…"
- "Prends soin de ton énergie en t'accordant un moment de pause…"
- "Mantra : 'Je m'ouvre aux belles surprises de l'univers.'"

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
    body: JSON.stringify({ to: phone, text: smsContent, from: 'Zodiak' })
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Erreur SMS: ${errorData.error || 'Envoi SMS échoué'}`);
  }
} 