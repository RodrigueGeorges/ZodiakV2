import { createClient } from '@supabase/supabase-js';
import { computeDailyTransitsLocal, type DailyTransits } from './_astroEngine';

// IMPORTANT: functions run server-side → use service role for DB writes
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 60;

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

/**
 * Calcule les transits planétaires du jour.
 *
 * Stratégie :
 *   1. Lookup cache `daily_transits` (1 ligne / jour, partagée par tous).
 *   2. Sinon, calcul LOCAL via `astronomy-engine` (~5ms, 0€).
 *   3. Persist en cache.
 *
 * Plus aucun appel Prokerala ici. Cf. `MIGRATION_META.md` Phase 3.
 */
export async function calculateDailyTransits(date: string): Promise<DailyTransits> {
  // 1. Cache
  const { data: cachedTransits } = await supabase
    .from('daily_transits')
    .select('transit_data')
    .eq('date', date)
    .maybeSingle();
  if (cachedTransits?.transit_data) {
    return cachedTransits.transit_data as DailyTransits;
  }

  // 2. Calcul local
  const transits = computeDailyTransitsLocal(date);

  // 3. Persist (best-effort)
  try {
    await supabase.from('daily_transits').upsert({
      date,
      transit_data: transits,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('⚠️ Cache transits non persisté:', err instanceof Error ? err.message : err);
  }

  return transits;
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

// NB : la fonction `sendSms` historique a été retirée — l'envoi de la guidance
// passe désormais exclusivement par WhatsApp / Instagram via `_metaUtils.ts`
// et `send-daily-guidance.ts`. Cf. `MIGRATION_META.md` pour le détail.