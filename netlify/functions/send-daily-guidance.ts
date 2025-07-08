import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
// Supprimer l'import d'AstrologyService qui cause le problème
// import { AstrologyService, NatalChart } from '../../src/lib/astrology';
import type { Database, Profile } from '../../src/lib/types/supabase';
import { toZonedTime, format } from 'date-fns-tz';
import { randomUUID } from 'crypto';

// Initialiser le client Supabase
const supabase = createClient<Database>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

const TIMEZONE = 'Europe/Paris'; // Fuseau horaire par défaut

// Types nécessaires
interface NatalChart {
  planets: Array<{
    name: string;
    longitude: number;
    house: number;
    sign: string;
    retrograde: boolean;
  }>;
  houses: Array<{
    number: number;
    sign: string;
    degree: number;
  }>;
  ascendant: {
    sign: string;
    degree: number;
  };
}

// Cache pour les tokens Prokerala (évite de refaire l'auth à chaque appel)
let prokeralaTokenCache: { token: string; expiresAt: number } | null = null;
const TOKEN_CACHE_DURATION = 50 * 60 * 1000; // 50 minutes (tokens expirent en 1h)

// Rate limiting pour éviter les appels trop fréquents
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 5; // Max 5 appels par minute

// Fonction pour obtenir un token Prokerala (avec cache)
async function getProkeralaToken(): Promise<string | null> {
  try {
    // Vérifier le cache
    if (prokeralaTokenCache && Date.now() < prokeralaTokenCache.expiresAt) {
      return prokeralaTokenCache.token;
    }

    // Rate limiting
    if (!checkRateLimit('prokerala_auth')) {
      console.warn('Rate limit atteint pour l\'authentification Prokerala');
      return null;
    }

    const clientId = process.env.PROKERALA_CLIENT_ID;
    const clientSecret = process.env.PROKERALA_CLIENT_SECRET;
    
    if (!clientId || !clientSecret) {
      console.warn('Configuration Prokerala manquante');
      return null;
    }

    const authUrl = 'https://api.prokerala.com/token';
    const tokenRes = await fetch(authUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        client_id: clientId, 
        client_secret: clientSecret, 
        grant_type: 'client_credentials' 
      }),
    });

    if (!tokenRes.ok) {
      console.error('Échec de l\'authentification Prokerala:', tokenRes.status, tokenRes.statusText);
      return null;
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;
    
    if (!accessToken) {
      console.error('Token d\'accès Prokerala manquant dans la réponse');
      return null;
    }

    // Mettre en cache le token
    prokeralaTokenCache = {
      token: accessToken,
      expiresAt: Date.now() + TOKEN_CACHE_DURATION
    };

    console.log('✅ Token Prokerala obtenu et mis en cache');
    return accessToken;

  } catch (error) {
    console.error('Erreur lors de l\'obtention du token Prokerala:', error);
    return null;
  }
}

// Fonction de rate limiting
function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const limit = rateLimitMap.get(identifier);

  if (!limit || now > limit.resetTime) {
    rateLimitMap.set(identifier, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW
    });
    return true;
  }

  if (limit.count >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }

  limit.count++;
  return true;
}

// Version optimisée de calculateDailyTransits avec cache Supabase
async function calculateDailyTransits(date: string): Promise<Record<string, unknown>> {
  try {
    // 1. Vérifier le cache Supabase d'abord
    const { data: cachedTransits, error: cacheError } = await supabase
      .from('daily_transits')
      .select('transit_data')
      .eq('date', date)
      .maybeSingle();

    if (!cacheError && cachedTransits?.transit_data) {
      console.log(`✅ Transits récupérés du cache pour ${date}`);
      return cachedTransits.transit_data;
    }

    // 2. Rate limiting pour les appels API
    if (!checkRateLimit('prokerala_transits')) {
      console.warn('Rate limit atteint pour les transits, utilisation de transits simulés');
      return getSimulatedTransits(date);
    }

    // 3. Obtenir le token Prokerala
    const accessToken = await getProkeralaToken();
    if (!accessToken) {
      console.warn('Impossible d\'obtenir le token Prokerala, utilisation de transits simulés');
      return getSimulatedTransits(date);
    }

    // 4. Appel API Prokerala
    const baseUrl = process.env.PROKERALA_BASE_URL;
    if (!baseUrl) {
      console.warn('URL Prokerala manquante, utilisation de transits simulés');
      return getSimulatedTransits(date);
    }

    const parisLatitude = 48.8566;
    const parisLongitude = 2.3522;
    const datetime = `${date}T12:00:00Z`;

    console.log(`🔄 Calcul des transits via Prokerala pour ${date}...`);

    const prokeralaRes = await fetch(`${baseUrl}/v2/astrology/natal-chart`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        datetime,
        latitude: parisLatitude,
        longitude: parisLongitude,
        house_system: 'placidus',
        chart_type: 'western',
      })
    });

    if (!prokeralaRes.ok) {
      const errorText = await prokeralaRes.text();
      console.error(`Erreur API Prokerala (${prokeralaRes.status}):`, errorText);
      return getSimulatedTransits(date);
    }

    const transitData = await prokeralaRes.json();
    
    // 5. Transformer et valider les données
    const transits: Record<string, unknown> = {};
    
    if (transitData.planets && Array.isArray(transitData.planets)) {
      transitData.planets.forEach((planet: any) => {
        if (planet.name && planet.sign) {
          transits[planet.name.toLowerCase()] = {
            sign: planet.sign,
            degree: planet.longitude || 0,
            house: planet.house || 1,
            retrograde: planet.is_retrograde === 'true'
          };
        }
      });
    }

    // 6. Sauvegarder dans le cache Supabase
    if (Object.keys(transits).length > 0) {
      try {
        await supabase
          .from('daily_transits')
          .upsert({
            date,
            transit_data: transits,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        console.log(`💾 Transits sauvegardés en cache pour ${date}`);
      } catch (saveError) {
        console.warn('Erreur lors de la sauvegarde des transits en cache:', saveError);
      }
    }

    console.log(`✅ Transits calculés pour ${date}:`, Object.keys(transits));
    return transits;

  } catch (error) {
    console.error('Erreur lors du calcul des transits:', error);
    return getSimulatedTransits(date);
  }
}

// Fonction de fallback avec des transits simulés
function getSimulatedTransits(date: string): Record<string, unknown> {
  // Générer des transits cohérents basés sur la date
  const dateObj = new Date(date);
  const dayOfYear = Math.floor((dateObj.getTime() - new Date(dateObj.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
  
  // Utiliser le jour de l'année pour générer des positions cohérentes
  const baseAngle = (dayOfYear / 365) * 360;
  
  return {
    sun: { 
      sign: getSignFromDegree(baseAngle), 
      degree: baseAngle % 30,
      house: Math.floor(baseAngle / 30) % 12 + 1,
      retrograde: false
    },
    moon: { 
      sign: getSignFromDegree(baseAngle * 13.2), // Lune plus rapide
      degree: (baseAngle * 13.2) % 30,
      house: Math.floor((baseAngle * 13.2) / 30) % 12 + 1,
      retrograde: false
    },
    mercury: { 
      sign: getSignFromDegree(baseAngle * 1.2), 
      degree: (baseAngle * 1.2) % 30,
      house: Math.floor((baseAngle * 1.2) / 30) % 12 + 1,
      retrograde: Math.random() > 0.8
    },
    venus: { 
      sign: getSignFromDegree(baseAngle * 0.8), 
      degree: (baseAngle * 0.8) % 30,
      house: Math.floor((baseAngle * 0.8) / 30) % 12 + 1,
      retrograde: Math.random() > 0.9
    },
    mars: { 
      sign: getSignFromDegree(baseAngle * 0.5), 
      degree: (baseAngle * 0.5) % 30,
      house: Math.floor((baseAngle * 0.5) / 30) % 12 + 1,
      retrograde: Math.random() > 0.85
    },
    jupiter: { 
      sign: getSignFromDegree(baseAngle * 0.08), 
      degree: (baseAngle * 0.08) % 30,
      house: Math.floor((baseAngle * 0.08) / 30) % 12 + 1,
      retrograde: Math.random() > 0.7
    },
    saturn: { 
      sign: getSignFromDegree(baseAngle * 0.03), 
      degree: (baseAngle * 0.03) % 30,
      house: Math.floor((baseAngle * 0.03) / 30) % 12 + 1,
      retrograde: Math.random() > 0.6
    },
    uranus: { 
      sign: getSignFromDegree(baseAngle * 0.01), 
      degree: (baseAngle * 0.01) % 30,
      house: Math.floor((baseAngle * 0.01) / 30) % 12 + 1,
      retrograde: Math.random() > 0.5
    },
    neptune: { 
      sign: getSignFromDegree(baseAngle * 0.007), 
      degree: (baseAngle * 0.007) % 30,
      house: Math.floor((baseAngle * 0.007) / 30) % 12 + 1,
      retrograde: Math.random() > 0.4
    },
    pluto: { 
      sign: getSignFromDegree(baseAngle * 0.004), 
      degree: (baseAngle * 0.004) % 30,
      house: Math.floor((baseAngle * 0.004) / 30) % 12 + 1,
      retrograde: Math.random() > 0.3
    }
  };
}

// Fonction utilitaire pour obtenir le signe à partir d'un degré
function getSignFromDegree(degree: number): string {
  const signs = [
    'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
    'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
  ];
  const normalizedDegree = ((degree % 360) + 360) % 360;
  const signIndex = Math.floor(normalizedDegree / 30);
  return signs[signIndex];
}

// Logique OpenAI optimisée avec cache
async function generateGuidanceForSms(natalChart: NatalChart, transits: Record<string, unknown>, date: string): Promise<{
  summary: string;
  love: { text: string; score: number };
  work: { text: string; score: number };
  energy: { text: string; score: number };
  mantra: string;
}> {
  try {
    // 1. Vérifier le cache pour cette combinaison thème natal + transits + date
    const cacheKey = `guidance_${date}_${JSON.stringify(natalChart.planets.map(p => `${p.name}${p.sign}${p.house}`)).slice(0, 100)}_${JSON.stringify(transits).slice(0, 100)}`;
    
    const { data: cachedGuidance, error: cacheError } = await supabase
      .from('guidance_cache')
      .select('guidance_data')
      .eq('cache_key', cacheKey)
      .maybeSingle();

    if (!cacheError && cachedGuidance?.guidance_data) {
      console.log(`✅ Guidance récupérée du cache pour ${date}`);
      return cachedGuidance.guidance_data;
    }

    // 2. Rate limiting pour OpenAI
    if (!checkRateLimit('openai_guidance')) {
      console.warn('Rate limit atteint pour OpenAI, utilisation de guidance par défaut');
      return getDefaultGuidance();
    }

    // 3. Générer la guidance via OpenAI
    console.log(`🔄 Génération de guidance via OpenAI pour ${date}...`);
    
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

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Erreur OpenAI (${response.status}):`, errorText);
      return getDefaultGuidance();
    }

    const data = await response.json();
    const guidance = JSON.parse(data.choices[0].message.content);

    // 4. Valider et sauvegarder en cache
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
        console.log(`💾 Guidance sauvegardée en cache pour ${date}`);
      } catch (saveError) {
        console.warn('Erreur lors de la sauvegarde de la guidance en cache:', saveError);
      }
    }

    return guidance;

  } catch (error) {
    console.error('Erreur lors de la génération de guidance:', error);
    return getDefaultGuidance();
  }
}

// Guidance par défaut en cas d'erreur
function getDefaultGuidance(): {
  summary: string;
  love: { text: string; score: number };
  work: { text: string; score: number };
  energy: { text: string; score: number };
  mantra: string;
} {
  return {
    summary: "Les aspects planétaires du jour vous invitent à l'action réfléchie. Restez à l'écoute de votre intuition tout en avançant avec détermination vers vos objectifs.",
    love: { 
      text: "Vénus forme des aspects harmonieux qui favorisent les échanges authentiques. C'est le moment d'exprimer vos sentiments avec sincérité et d'ouvrir votre coeur à de nouvelles connexions.",
      score: 75
    },
    work: { 
      text: "Mercure soutient vos projets professionnels. Votre clarté d'esprit est un atout majeur aujourd'hui. Profitez de cette énergie pour communiquer vos idées et prendre des initiatives constructives.",
      score: 80
    },
    energy: { 
      text: "L'alignement des planètes vous apporte une belle vitalité. C'est une excellente journée pour démarrer de nouvelles activités physiques ou pour vous consacrer à des projets qui vous passionnent.",
      score: 70
    },
    mantra: "Je m'ouvre aux belles surprises de l'univers et j'avance avec confiance."
  };
}

// Logique SMS (utiliser Vonage au lieu de Brevo pour la cohérence)
async function sendSms(phoneNumber: string, content: string): Promise<void> {
  // Utiliser la fonction send-sms existante
  const response = await fetch(`${process.env.URL || 'https://zodiak.netlify.app'}/.netlify/functions/send-sms`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      to: phoneNumber,
      text: content,
      from: 'Zodiak'
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Erreur SMS: ${errorData.error || 'Envoi SMS échoué'}`);
  }

  console.log(`SMS envoyé avec succès à ${phoneNumber}`);
}

function generateShortCode(length = 6) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// --- Logique principale de la fonction ---

const sendGuidanceSms = async (profile: Profile & { _guidanceDate?: string }) => {
  if (!profile.phone || !profile.natal_chart) {
    console.warn(`Profil incomplet pour l'utilisateur ${profile.id}.`);
    return;
  }
  
  try {
    console.log(`🚀 Génération de guidance pour l'utilisateur ${profile.id}...`);
    
    // 1. Calculer les transits du jour
    const today = profile._guidanceDate || format(toZonedTime(new Date(), TIMEZONE), 'yyyy-MM-dd', { timeZone: TIMEZONE });
    const transits = await calculateDailyTransits(today);

    // 2. Générer la guidance personnalisée
    const guidance = await generateGuidanceForSms(profile.natal_chart as unknown as NatalChart, transits, today);
    
    // 3. Générer un token unique et un code court unique
    const token = randomUUID();
    let shortCode;
    let isUnique = false;
    // Boucle pour garantir l'unicité du shortCode
    while (!isUnique) {
      shortCode = generateShortCode();
      const { data: existing } = await supabase.from('guidance_token').select('id').eq('short_code', shortCode).maybeSingle();
      if (!existing) isUnique = true;
    }
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    await supabase.from('guidance_token').upsert({
      user_id: profile.id,
      token,
      date: today,
      expires_at: expiresAt,
      short_code: shortCode
    });
    
    // 4. Lien court
    const appUrl = process.env.URL || 'https://zodiak.netlify.app';
    const shortLink = `${appUrl}/g/${shortCode}`;
    
    // 5. Format du SMS enrichi
    const dateFr = new Date(today).toLocaleDateString('fr-FR');
    const mantra = guidance.mantra || 'Que les astres vous guident !';
    const smsContent = `✨ Bonjour ${profile.name || 'cher utilisateur'} !\n\nTa guidance du ${dateFr} :\n🌞 ${guidance.summary}\n💖 Amour : ${guidance.love.text}\n💼 Travail : ${guidance.work.text}\n⚡ Énergie : ${guidance.energy.text}\n\n👉 Guidance complète (valable 24h) : ${shortLink}\n\n🌟 Mantra : " ${mantra} "`;

    // 6. Envoyer le SMS
    await sendSms(profile.phone, smsContent);

    // 7. Sauvegarder la guidance dans la base de données pour la page web
    await supabase
      .from('daily_guidance')
      .upsert({
        user_id: profile.id,
        date: today,
        summary: guidance.summary,
        love: guidance.love,
        work: guidance.work,
        energy: guidance.energy,
      });

    // 8. Mettre à jour la date de dernière guidance envoyée
    await supabase
      .from('profiles')
      .update({ 
        last_guidance_sent: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', profile.id);

    console.log(`✅ Guidance envoyée avec succès à l'utilisateur ${profile.id}`);

  } catch (error) {
    console.error(`❌ Erreur lors de l'envoi de la guidance à ${profile.id}:`, error);
    
    // Envoyer un SMS d'erreur simple si la génération échoue
    try {
      const fallbackMessage = `✨ Bonjour ${profile.name || 'cher utilisateur'} !

Votre guidance quotidienne est prête sur l'application Zodiak.

Découvrez vos conseils personnalisés : ${process.env.URL || 'https://zodiak.netlify.app'}/guidance

🌟 Que les astres vous guident !`;
      
      await sendSms(profile.phone, fallbackMessage);
      
      // Mettre à jour quand même la date d'envoi
      await supabase
        .from('profiles')
        .update({ 
          last_guidance_sent: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id);
        
      console.log(`✅ SMS de fallback envoyé à l'utilisateur ${profile.id}`);
    } catch (fallbackError) {
      console.error(`❌ Erreur même pour le SMS de fallback à ${profile.id}:`, fallbackError);
    }
  }
};

const handler: Handler = async () => {
  try {
    console.log('🕐 Début de la vérification des guidances quotidiennes...');
    
    // Récupérer tous les utilisateurs avec SMS activé et abonnement valide
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('daily_guidance_sms_enabled', true)
      .in('subscription_status', ['active', 'trial']);

    if (error) {
      console.error("❌ Erreur lors de la récupération des profils:", error);
      return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }

    if (!profiles || profiles.length === 0) {
      console.log("ℹ️ Aucun utilisateur à notifier.");
      return { statusCode: 200, body: JSON.stringify({ message: "Aucun utilisateur à notifier." }) };
    }
    
    console.log(`📊 Trouvé ${profiles.length} utilisateurs avec SMS activé.`);

    // Heure et date locale Europe/Paris
    const nowUtc = new Date();
    const nowParis = toZonedTime(nowUtc, TIMEZONE);
    console.log(`🕗 Heure locale Paris: ${format(nowParis, 'yyyy-MM-dd HH:mm', { timeZone: TIMEZONE })}`);

    let sentCount = 0;
    let skippedCount = 0;

    for (const profile of profiles) {
      try {
        // Vérifier si l'utilisateur a un numéro de téléphone
        if (!profile.phone) {
          console.log(`⚠️ Utilisateur ${profile.id} n'a pas de numéro de téléphone`);
          continue;
        }

        // Vérifier si l'utilisateur a un thème natal
        if (!profile.natal_chart) {
          console.log(`⚠️ Utilisateur ${profile.id} n'a pas de thème natal`);
          continue;
        }

        // Date du jour (Europe/Paris)
        const todayParis = format(toZonedTime(new Date(), TIMEZONE), 'yyyy-MM-dd', { timeZone: TIMEZONE });

        // Vérifier si la guidance du jour existe déjà
        const { data: existingGuidance } = await supabase
          .from('daily_guidance')
          .select('*')
          .eq('user_id', profile.id)
          .eq('date', todayParis)
          .maybeSingle();

        if (!existingGuidance) {
          // Générer la guidance et l'envoyer par SMS
          console.log(`🚀 Génération et envoi de la guidance pour ${profile.id} (${profile.name})`);
          await sendGuidanceSms({ ...profile, _guidanceDate: todayParis });
          sentCount++;
        } else {
          console.log(`⏭️ Guidance déjà existante pour aujourd'hui pour l'utilisateur ${profile.id}`);
          skippedCount++;
        }
      } catch (profileError) {
        console.error(`❌ Erreur lors du traitement de l'utilisateur ${profile.id}:`, profileError);
      }
    }

    console.log(`✅ Vérification terminée. ${sentCount} SMS envoyés, ${skippedCount} ignorés.`);

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        message: 'Vérification des guidances terminée.',
        sent: sentCount,
        skipped: skippedCount,
        total: profiles.length
      }),
    };
  } catch (error) {
    console.error('❌ Erreur générale dans le handler:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Erreur inconnue',
        message: 'Erreur lors de la vérification des guidances'
      }),
    };
  }
};

export { handler }; 