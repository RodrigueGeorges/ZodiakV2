// Script de diagnostic pour le chat astro
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

async function testChatAstroDiagnostic() {
  console.log('🔍 Diagnostic du chat astro...');
  
  try {
    // 1. Test de la configuration
    console.log('\n1️⃣ Test de la configuration...');
    
    const openaiKey = process.env.OPENAI_API_KEY;
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    console.log('OpenAI API Key:', !!openaiKey);
    console.log('Supabase URL:', !!supabaseUrl);
    console.log('Supabase Key:', !!supabaseKey);
    
    if (!openaiKey || !supabaseUrl || !supabaseKey) {
      console.log('❌ Configuration manquante');
      return;
    }
    
    console.log('✅ Configuration présente');
    
    // 2. Test de la fonction OpenAI
    console.log('\n2️⃣ Test de la fonction OpenAI...');
    
    try {
      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'Tu es un astrologue professionnel. Réponds brièvement.'
            },
            {
              role: 'user',
              content: 'Dis-moi bonjour en tant qu\'astrologue.'
            }
          ],
          max_tokens: 100,
          temperature: 0.7,
          stream: false
        })
      });
      
      if (openaiResponse.ok) {
        const data = await openaiResponse.json();
        console.log('✅ OpenAI fonctionne');
        console.log('📝 Réponse:', data.choices[0].message.content);
      } else {
        console.log('❌ Erreur OpenAI:', openaiResponse.status);
        const errorText = await openaiResponse.text();
        console.log('Détails:', errorText);
      }
    } catch (openaiError) {
      console.log('❌ Erreur OpenAI:', openaiError.message);
    }
    
    // 3. Test de la base de données
    console.log('\n3️⃣ Test de la base de données...');
    
    try {
      // Test de lecture
      const { data: testData, error: readError } = await supabase
        .from('conversations')
        .select('id')
        .limit(1);
      
      if (readError) {
        console.log('❌ Erreur lecture DB:', readError.message);
      } else {
        console.log('✅ Lecture DB fonctionne');
      }
      
      // Test d'écriture (création d'une conversation de test)
      const { data: insertData, error: insertError } = await supabase
        .from('conversations')
        .insert({
          user_id: 'test-user-id',
          messages: [{ role: 'user', content: 'Test' }],
          preferences: {}
        })
        .select('id')
        .single();
      
      if (insertError) {
        console.log('❌ Erreur écriture DB:', insertError.message);
      } else {
        console.log('✅ Écriture DB fonctionne');
        console.log('📝 Conversation créée:', insertData.id);
        
        // Nettoyer la conversation de test
        await supabase
          .from('conversations')
          .delete()
          .eq('id', insertData.id);
        console.log('🧹 Conversation de test supprimée');
      }
    } catch (dbError) {
      console.log('❌ Erreur DB générale:', dbError.message);
    }
    
    // 4. Test de la fonction astro-chatbot
    console.log('\n4️⃣ Test de la fonction astro-chatbot...');
    
    try {
      const appUrl = process.env.URL || 'https://zodiak.netlify.app';
      const chatbotResponse = await fetch(`${appUrl}/.netlify/functions/astro-chatbot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: 'Dis-moi bonjour',
          firstName: 'Test',
          natalChart: mockNatalChart,
          userId: 'test-user-id',
          conversationId: null
        })
      });
      
      console.log('📊 Statut réponse:', chatbotResponse.status);
      console.log('📊 Content-Type:', chatbotResponse.headers.get('content-type'));
      
      if (chatbotResponse.ok) {
        const contentType = chatbotResponse.headers.get('content-type');
        
        if (contentType && contentType.includes('text/event-stream')) {
          console.log('✅ Streaming détecté');
          const reader = chatbotResponse.body?.getReader();
          if (reader) {
            let fullText = '';
            const decoder = new TextDecoder();
            let done = false;
            
            while (!done) {
              const { value, done: doneReading } = await reader.read();
              done = doneReading;
              if (value) {
                const text = decoder.decode(value);
                fullText += text;
                console.log('📝 Chunk reçu:', text.substring(0, 100));
              }
            }
            console.log('✅ Réponse complète:', fullText.substring(0, 200));
          }
        } else {
          console.log('✅ Réponse JSON détectée');
          const data = await chatbotResponse.json();
          console.log('📝 Réponse:', JSON.stringify(data, null, 2));
        }
      } else {
        console.log('❌ Erreur chatbot:', chatbotResponse.status);
        const errorText = await chatbotResponse.text();
        console.log('Détails:', errorText);
      }
    } catch (chatbotError) {
      console.log('❌ Erreur chatbot:', chatbotError.message);
    }
    
    // 5. Test des problèmes identifiés
    console.log('\n5️⃣ Test des problèmes identifiés...');
    
    // Problème 1: Gestion du streaming
    console.log('🔍 Problème potentiel 1: Gestion du streaming');
    console.log('   - Le frontend attend du streaming mais le backend peut retourner du JSON');
    console.log('   - La logique de parsing est complexe et peut échouer');
    
    // Problème 2: Parsing JSON
    console.log('🔍 Problème potentiel 2: Parsing JSON');
    console.log('   - Le frontend essaie de parser des réponses non-JSON');
    console.log('   - Les erreurs de parsing sont silencieuses');
    
    // Problème 3: Gestion d'erreurs
    console.log('🔍 Problème potentiel 3: Gestion d\'erreurs');
    console.log('   - Les erreurs ne sont pas bien propagées au frontend');
    console.log('   - Le fallback peut ne pas fonctionner correctement');
    
    // Problème 4: Validation des données
    console.log('🔍 Problème potentiel 4: Validation des données');
    console.log('   - Pas de validation des données d\'entrée');
    console.log('   - Le natal_chart peut être mal formaté');
    
  } catch (error) {
    console.log('❌ Erreur générale:', error.message);
  }
}

testChatAstroDiagnostic(); 