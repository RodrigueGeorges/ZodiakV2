// Test script pour vérifier la génération de guidance via OpenAI
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://your-project.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key'
);

// Mock des données de test
const mockNatalChart = {
  planets: [
    { name: 'Sun', sign: 'Leo', house: 5, longitude: 120 },
    { name: 'Moon', sign: 'Cancer', house: 4, longitude: 90 },
    { name: 'Mercury', sign: 'Virgo', house: 6, longitude: 150 },
    { name: 'Venus', sign: 'Libra', house: 7, longitude: 180 },
    { name: 'Mars', sign: 'Scorpio', house: 8, longitude: 210 }
  ],
  houses: [
    { number: 1, sign: 'Aries', degree: 0 },
    { number: 2, sign: 'Taurus', degree: 30 },
    { number: 3, sign: 'Gemini', degree: 60 }
  ],
  ascendant: { sign: 'Aries', degree: 0 }
};

const mockTransits = {
  sun: { sign: 'Capricorn', degree: 15, house: 10, retrograde: false },
  moon: { sign: 'Pisces', degree: 25, house: 12, retrograde: false },
  mercury: { sign: 'Capricorn', degree: 8, house: 10, retrograde: true },
  venus: { sign: 'Sagittarius', degree: 20, house: 9, retrograde: false },
  mars: { sign: 'Aquarius', degree: 5, house: 11, retrograde: false }
};

async function testOpenAIGuidance() {
  console.log('🧪 Test de génération de guidance via OpenAI...');
  
  try {
    // 1. Vérifier la configuration OpenAI
    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      console.log('❌ OPENAI_API_KEY non configurée');
      return;
    }
    console.log('✅ Clé OpenAI configurée');
    
    // 2. Test direct de l'API OpenAI
    console.log('🔄 Test de l\'API OpenAI...');
    const prompt = `
Tu es un astrologue expert, créatif, inspirant et moderne, qui rédige des guidances quotidiennes pour une application de guidance astrologique personnalisée.

Ta mission :
- Génère une guidance du jour profonde, nuancée, innovante et personnalisée, basée sur le thème natal (fourni) et les transits planétaires du jour (fournis).
- Utilise un ton riche, imagé, parfois poétique ou philosophique, sans jargon technique inaccessible.
- N'hésite pas à utiliser des métaphores, des références à la mythologie, à la littérature, ou à la culture populaire pour illustrer tes conseils.
- Propose des conseils concrets, mais aussi des réflexions ou des inspirations qui invitent à la prise de recul.
- Structure la réponse en 4 parties :
  1. Résumé général (2-3 phrases, synthétique, engageant, mais profond)
  2. Amour : conseil nuancé, imagé, parfois symbolique, avec un score sur 100
  3. Travail : conseil pratique, mais aussi visionnaire ou inspirant, avec un score sur 100
  4. Bien-être/Énergie : conseil pour l'équilibre personnel, ouvert à la spiritualité, la nature, la créativité, avec un score sur 100
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
- Thème natal : ${JSON.stringify(mockNatalChart, null, 2)}
- Transits du jour : ${JSON.stringify(mockTransits, null, 2)}

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
        'Authorization': `Bearer ${openaiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: 'Tu es un astrologue expert.' }, 
          { role: 'user', content: prompt }
        ],
        max_tokens: 400,
        temperature: 0.7,
        response_format: { type: 'json_object' },
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`❌ Erreur OpenAI (${response.status}):`, errorText);
      return;
    }

    const data = await response.json();
    console.log('✅ Réponse OpenAI reçue');
    
    // 3. Parser et valider la réponse
    let guidance;
    try {
      guidance = JSON.parse(data.choices[0].message.content);
      console.log('✅ Réponse JSON parsée avec succès');
    } catch (parseError) {
      console.log('❌ Erreur de parsing JSON:', parseError.message);
      console.log('Réponse brute:', data.choices[0].message.content);
      return;
    }

    // 4. Valider la structure de la guidance
    console.log('🔍 Validation de la structure de la guidance...');
    
    const requiredFields = ['summary', 'love', 'work', 'energy', 'mantra'];
    const missingFields = requiredFields.filter(field => !guidance[field]);
    
    if (missingFields.length > 0) {
      console.log(`❌ Champs manquants: ${missingFields.join(', ')}`);
      console.log('Structure reçue:', Object.keys(guidance));
    } else {
      console.log('✅ Tous les champs requis sont présents');
    }

    // 5. Valider les scores
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
    } else {
      console.log('✅ Tous les scores sont valides');
    }

    // 6. Afficher la guidance générée
    console.log('\n📝 Guidance générée:');
    console.log('─'.repeat(50));
    console.log(`Résumé: ${guidance.summary}`);
    console.log(`Amour: ${guidance.love?.text} (Score: ${guidance.love?.score})`);
    console.log(`Travail: ${guidance.work?.text} (Score: ${guidance.work?.score})`);
    console.log(`Énergie: ${guidance.energy?.text} (Score: ${guidance.energy?.score})`);
    console.log(`Mantra: ${guidance.mantra}`);
    console.log('─'.repeat(50));

    // 7. Test de sauvegarde en cache
    console.log('\n💾 Test de sauvegarde en cache...');
    try {
      const cacheKey = `test_guidance_${Date.now()}`;
      const { error: cacheError } = await supabase
        .from('guidance_cache')
        .upsert({
          cache_key: cacheKey,
          guidance_data: guidance,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (cacheError) {
        console.log('❌ Erreur lors de la sauvegarde en cache:', cacheError.message);
      } else {
        console.log('✅ Guidance sauvegardée en cache avec succès');
      }
    } catch (cacheError) {
      console.log('❌ Erreur lors du test de cache:', cacheError.message);
    }

    // 8. Test de récupération depuis le cache
    console.log('\n🔍 Test de récupération depuis le cache...');
    try {
      const { data: cachedGuidance, error: retrieveError } = await supabase
        .from('guidance_cache')
        .select('guidance_data')
        .eq('cache_key', cacheKey)
        .maybeSingle();

      if (retrieveError) {
        console.log('❌ Erreur lors de la récupération du cache:', retrieveError.message);
      } else if (cachedGuidance) {
        console.log('✅ Guidance récupérée depuis le cache avec succès');
      } else {
        console.log('❌ Guidance non trouvée dans le cache');
      }
    } catch (retrieveError) {
      console.log('❌ Erreur lors du test de récupération:', retrieveError.message);
    }

  } catch (error) {
    console.log('❌ Erreur générale lors du test:', error.message);
  }
}

// Exécuter le test
testOpenAIGuidance(); 