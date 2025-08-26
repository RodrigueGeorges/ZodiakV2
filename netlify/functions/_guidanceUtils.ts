import { createClient } from '@supabase/supabase-js';
import { toZonedTime, format } from 'date-fns-tz';
import { randomUUID as cryptoRandomUUID } from 'crypto';

// IMPORTANT: functions run server-side → use service role for DB writes
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
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
    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    params.append('client_id', clientId);
    params.append('client_secret', clientSecret);
    const tokenRes = await fetch(authUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
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
  const dateObj = new Date(date);
  const dayOfYear = Math.floor((dateObj.getTime() - new Date(dateObj.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
  const baseAngle = (dayOfYear / 365) * 360;
  
  function getSignFromDegree(degree) {
    const signs = [
      'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
      'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
    ];
    const normalizedDegree = ((degree % 360) + 360) % 360;
    const signIndex = Math.floor(normalizedDegree / 30);
    return signs[signIndex];
  }
  
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
    }
  };
}

export async function calculateDailyTransits(date) {
  try {
    console.log(`🔄 Calcul des transits pour ${date}...`);
    
    // 1. Vérifier le cache d'abord
    const { data: cachedTransits, error: cacheError } = await supabase
      .from('daily_transits')
      .select('transit_data')
      .eq('date', date)
      .maybeSingle();
    
    if (!cacheError && cachedTransits?.transit_data) {
      console.log(`✅ Transits récupérés du cache pour ${date}`);
      return cachedTransits.transit_data;
    }

    // 2. Rate limiting
    if (!checkRateLimit('prokerala_transits')) {
      console.log('⚠️ Rate limit atteint pour Prokerala, utilisation de transits simulés');
      return getSimulatedTransits(date);
    }

    // 3. Obtenir le token Prokerala
    const accessToken = await getProkeralaToken();
    if (!accessToken) {
      console.log('⚠️ Impossible d\'obtenir le token Prokerala, utilisation de transits simulés');
      return getSimulatedTransits(date);
    }

    // 4. Vérifier la configuration et normaliser l'URL de base
    const rawBaseUrl = process.env.PROKERALA_BASE_URL;
    if (!rawBaseUrl) {
      console.log('⚠️ URL Prokerala manquante, utilisation de transits simulés');
      return getSimulatedTransits(date);
    }
    // Normalisation: enlever trailing slashes
    const trimmedBase = rawBaseUrl.replace(/\/+$/, '');
    // Si l'URL contient déjà "/v2/astrology", on n'ajoute pas de doublon
    const apiUrl = trimmedBase.includes('/v2/astrology')
      ? `${trimmedBase}/transit`
      : `${trimmedBase}/v2/astrology/transit`;

    // 5. Appel API Prokerala pour les transits
    const parisLatitude = 48.8566;
    const parisLongitude = 2.3522;
    const datetime = `${date}T12:00:00Z`;

    console.log(`📤 Appel API Prokerala pour ${date}...`);
    
    // Utiliser l'API de transits au lieu de natal-chart
    const prokeralaRes = await fetch(apiUrl, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${accessToken}`, 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({ 
        datetime, 
        latitude: parisLatitude, 
        longitude: parisLongitude, 
        house_system: 'placidus', 
        chart_type: 'western' 
      })
    });

    if (!prokeralaRes.ok) {
      const errorText = await prokeralaRes.text();
      console.log(`❌ Erreur API Prokerala (${prokeralaRes.status}):`, errorText);
      console.log('⚠️ Utilisation de transits simulés');
      return getSimulatedTransits(date);
    }

    const transitData = await prokeralaRes.json();
    console.log('✅ Données de transits reçues de Prokerala');

    // 6. Transformer les données
    const transits = {};
    if (transitData.planets && Array.isArray(transitData.planets)) {
      transitData.planets.forEach((planet) => {
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

    // 7. Sauvegarder en cache si des données valides
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
        console.log('⚠️ Erreur lors de la sauvegarde des transits en cache:', saveError.message);
      }
    } else {
      console.log('⚠️ Aucune donnée de transit valide reçue, utilisation de transits simulés');
      return getSimulatedTransits(date);
    }

    console.log(`✅ Transits calculés pour ${date}:`, Object.keys(transits));
    return transits;

  } catch (error) {
    console.log('❌ Erreur lors du calcul des transits:', error.message);
    console.log('⚠️ Utilisation de transits simulés');
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
    console.log(`🔄 Génération de guidance pour ${date}...`);
    
    // 1. Vérifier la configuration OpenAI
    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      console.log('❌ OPENAI_API_KEY non configurée');
      return getDefaultGuidance();
    }

    // 2. Vérifier les données d'entrée
    if (!natalChart || !transits) {
      console.log('❌ Données d\'entrée manquantes');
      return getDefaultGuidance();
    }

    // 3. Générer la clé de cache
    const cacheKey = `guidance_${date}_${JSON.stringify(natalChart.planets?.map(p => `${p.name}${p.sign}${p.house}`)).slice(0, 100)}_${JSON.stringify(transits).slice(0, 100)}`;
    
    // 4. Vérifier le cache
    const { data: cachedGuidance, error: cacheError } = await supabase
      .from('guidance_cache')
      .select('guidance_data')
      .eq('cache_key', cacheKey)
      .maybeSingle();
    
    if (!cacheError && cachedGuidance?.guidance_data) {
      console.log(`✅ Guidance récupérée du cache pour ${date}`);
      return cachedGuidance.guidance_data;
    }

    // 5. Rate limiting
    if (!checkRateLimit('openai_guidance')) {
      console.log('⚠️ Rate limit atteint pour OpenAI');
      return getDefaultGuidance();
    }

    // 6. Préparer le prompt avec analyse des transits
    console.log('📊 Analyse des transits pour la guidance...');
    
         // Analyser les transits pour créer un contexte astrologique
     const transitAnalysis: string[] = [];
     const planetMeanings = {
       sun: 'énergie vitale, identité, créativité',
       moon: 'émotions, intuition, besoins intimes',
       mercury: 'communication, pensée, apprentissage',
       venus: 'amour, beauté, harmonie, valeurs',
       mars: 'action, courage, passion, conflit',
       jupiter: 'expansion, sagesse, opportunités',
       saturn: 'structure, responsabilité, limites'
     };
     
     Object.entries(transits).forEach(([planet, data]) => {
       if (data && typeof data === 'object' && 'sign' in data && data.sign) {
         const meaning = planetMeanings[planet as keyof typeof planetMeanings] || 'influence planétaire';
         const degree = (data as any).degree || 0;
         transitAnalysis.push(`${planet} en ${(data as any).sign} (${degree}°) - ${meaning}`);
       }
     });
    
    const transitContext = transitAnalysis.length > 0 
      ? `Transits du jour : ${transitAnalysis.join(', ')}`
      : 'Transits planétaires du jour disponibles pour analyse';
    
         const prompt = `
Tu es un astrologue professionnel expérimenté, spécialisé dans l'interprétation des transits planétaires et la guidance personnalisée.

MISSION : Analyse les transits du jour et fournis une guidance précise, bienveillante et mystérieuse qui reflète les véritables influences astrologiques.

TON ET STYLE :
- Professionnel et expert, sans être froid
- Bienveillant et encourageant, sans être naïf
- Mystérieux et profond, sans être obscur
- Concret et pratique, sans être banal
- Évite le langage poétique excessif, privilégie la clarté

CONTEXTE ASTROLOGIQUE :
${transitContext}

THÈME NATAL DE L'UTILISATEUR :
${JSON.stringify(natalChart, null, 2)}

TRANSITS DÉTAILLÉS DU JOUR :
${JSON.stringify(transits, null, 2)}

INSTRUCTIONS SPÉCIFIQUES :
1. Analyse les aspects planétaires du jour avec précision
2. Identifie les énergies dominantes et leurs implications pratiques
3. Propose des conseils concrets basés sur l'astrologie
4. Maintiens un ton mystérieux mais accessible
5. Varie le contenu selon les transits spécifiques
6. Évite les clichés et le langage trop poétique

STRUCTURE OBLIGATOIRE (JSON uniquement) :
{
  "summary": "Synthèse des influences du jour (2-3 phrases claires et mystérieuses)",
  "love": { 
    "text": "Guidance amoureuse basée sur Vénus et les aspects du jour (concret et bienveillant)", 
    "score": 0-100 
  },
  "work": { 
    "text": "Conseils professionnels basés sur Mercure, Mars et les transits (pratique et inspirant)", 
    "score": 0-100 
  },
  "energy": { 
    "text": "Guidance énergétique basée sur le Soleil, la Lune et les aspects (mystérieux et bienveillant)", 
    "score": 0-100 
  },
  "mantra": "Phrase inspirante et mystérieuse basée sur les transits du jour"
}

EXEMPLES DE TON :
- "Les aspects de Mercure favorisent la communication claire aujourd'hui"
- "Vénus en harmonie invite à l'ouverture du cœur avec discernement"
- "L'énergie lunaire révèle des intuitions importantes à écouter"
- "Les transits martiens soutiennent l'action réfléchie et déterminée"

IMPORTANT : Chaque guidance doit être UNIQUE, professionnelle, bienveillante et mystérieuse, reflétant les transits spécifiques du jour.`;

    console.log('📤 Envoi de la requête à OpenAI...');
    
    // 7. Appel à OpenAI
    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
    let response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiKey}`
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: 'Tu es un astrologue expert. Réponds UNIQUEMENT en JSON valide.' }, 
          { role: 'user', content: prompt }
        ],
        max_tokens: 500,
        temperature: 0.7,
        response_format: { type: 'json_object' },
      })
    });

    // Retry simple en cas de 429
    if (response.status === 429) {
      console.warn('⚠️ OpenAI 429, nouvelle tentative après court délai...');
      await new Promise(r => setTimeout(r, 1000));
      response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiKey}`
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: 'Tu es un astrologue expert. Réponds UNIQUEMENT en JSON valide.' }, 
            { role: 'user', content: prompt }
          ],
          max_tokens: 500,
          temperature: 0.7,
          response_format: { type: 'json_object' },
        })
      });
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`❌ Erreur OpenAI (${response.status}):`, errorText);
      return getDefaultGuidance();
    }

    const data = await response.json();
    console.log('✅ Réponse OpenAI reçue');

    // 8. Parser et valider la réponse
    let guidance;
    try {
      guidance = JSON.parse(data.choices[0].message.content);
      console.log('✅ Réponse JSON parsée avec succès');
    } catch (parseError) {
      console.log('❌ Erreur de parsing JSON:', parseError.message);
      console.log('Réponse brute:', data.choices[0].message.content);
      return getDefaultGuidance();
    }

    // 9. Valider la structure
    const requiredFields = ['summary', 'love', 'work', 'energy', 'mantra'];
    const missingFields = requiredFields.filter(field => !guidance[field]);
    
    if (missingFields.length > 0) {
      console.log(`❌ Champs manquants: ${missingFields.join(', ')}`);
      return getDefaultGuidance();
    }

    // 10. Valider les scores
    const scoreFields = ['love', 'work', 'energy'];
    const invalidScores = scoreFields.filter(field => {
      const fieldData = guidance[field];
      return !fieldData || typeof fieldData !== 'object' || 
             !fieldData.text || !fieldData.score || 
             typeof fieldData.score !== 'number' || 
             fieldData.score < 0 || fieldData.score > 100;
    });

    if (invalidScores.length > 0) {
      console.log(`❌ Scores invalides pour: ${invalidScores.join(', ')}`);
      // Corriger les scores invalides
      scoreFields.forEach(field => {
        if (!guidance[field] || typeof guidance[field] !== 'object') {
          guidance[field] = { text: '', score: 75 };
        } else if (!guidance[field].text || !guidance[field].score) {
          guidance[field] = { 
            text: guidance[field].text || '', 
            score: guidance[field].score || 75 
          };
        }
      });
    }

    console.log('✅ Guidance validée avec succès');

    // 11. Sauvegarder en cache
    try {
      await supabase
        .from('guidance_cache')
        .upsert({
          cache_key: cacheKey,
          guidance_data: guidance,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      console.log('💾 Guidance sauvegardée en cache');
    } catch (cacheError) {
      console.log('⚠️ Erreur lors de la sauvegarde en cache:', cacheError.message);
    }

    return guidance;
  } catch (error) {
    console.log('❌ Erreur générale dans generateGuidanceWithOpenAI:', error.message);
    return getDefaultGuidance();
  }
}

export async function sendSms(phone, guidance, name, userId = null) {
  // Utiliser l'URL du site Netlify (production ou preview) si disponible
  const appUrl = process.env.URL || process.env.DEPLOY_PRIME_URL || 'https://zodiakv2.netlify.app';
  
  // Générer un lien court si userId est fourni
  let shortLink = '';
  if (userId) {
    try {
      const token = randomUUID();
      const today = new Date().toISOString().slice(0, 10);
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      // Générer un short code réellement unique (avec vérification + retry en cas de collision)
      const shortCode = await generateUniqueShortCode();

      // Tenter l'upsert avec gestion des collisions éventuelles (unique short_code)
      let attempts = 0;
      const maxAttempts = 5;
      let upsertError: any | null = null;
      let finalShortCode = shortCode;

      while (attempts < maxAttempts) {
        const { error } = await supabase.from('guidance_token').upsert({
          user_id: userId,
          token,
          date: today,
          expires_at: expiresAt,
          short_code: finalShortCode
        });

        if (!error) {
          // Vérifier que la ligne existe bien
          const { data: verifyRow } = await supabase
            .from('guidance_token')
            .select('id, short_code')
            .eq('short_code', finalShortCode)
            .eq('token', token)
            .maybeSingle();

          if (verifyRow) {
            upsertError = null;
            break;
          }
        }

        // Si violation d'unicité, régénérer un code et réessayer
        if (error && (error.code === '23505' || (typeof error.message === 'string' && error.message.includes('unique') && error.message.includes('short_code')))) {
          attempts++;
          finalShortCode = generateShortCode(10);
          continue;
        }

        upsertError = error || new Error('Upsert failed without explicit error');
        break;
      }

      if (upsertError) {
        console.error('Erreur upsert guidance_token:', upsertError);
        throw upsertError;
      }

      // Créer l'entrée de tracking (best-effort)
      const { error: trackingError } = await supabase.from('sms_tracking').insert({
        user_id: userId,
        short_code: finalShortCode,
        token: token,
        date: today,
        sent_at: new Date().toISOString()
      });
      if (trackingError) {
        console.warn('⚠️ Erreur lors de la création du tracking SMS:', trackingError.message || trackingError);
      }
      console.log('🔗 Lien SMS généré:', { shortCode: finalShortCode, token, userId });
      
      shortLink = `${appUrl}/g/${finalShortCode}`;
    } catch (error) {
      console.error('Erreur lors de la génération du lien court:', error);
    }
  }
  
  // Contenu du SMS avec ou sans lien
  let smsContent;
  if (shortLink) {
    smsContent = `✨ Bonjour ${name?.split(' ')[0] || 'cher utilisateur'} !\n\nDécouvre ta guidance du jour ! 🌟\nLes astres ont un message spécial pour toi 👇\n${shortLink}\n(Valable 24h)`;
    console.log('✉️ Contenu SMS (avec lien):', { shortLink });
  } else {
    smsContent = `✨ Bonjour ${name?.split(' ')[0] || 'cher utilisateur'} !\n\nDécouvre ta guidance du jour ! 🌟\n${guidance.summary}\n\n💖 Amour : ${guidance.love.text}\n💼 Travail : ${guidance.work.text}\n⚡ Énergie : ${guidance.energy.text}\n\nMantra : ${guidance.mantra}\n\nZodiak - Ton guide astral quotidien`;
  }
  
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

// Fonction utilitaire pour générer un code court
function generateShortCode(length = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Fonction utilitaire pour générer un UUID
function randomUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
} 

// Vérifie l'unicité du code dans la table guidance_token et régénère si nécessaire
async function generateUniqueShortCode(): Promise<string> {
  let code = generateShortCode(8);
  let attempts = 0;
  const maxAttempts = 5;
  while (attempts < maxAttempts) {
    const { data, error } = await supabase
      .from('guidance_token')
      .select('id')
      .eq('short_code', code)
      .maybeSingle();
    if (!error && !data) {
      return code;
    }
    attempts++;
    code = generateShortCode(10);
  }
  return code;
}