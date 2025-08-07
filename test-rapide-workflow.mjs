// Test rapide des points critiques du workflow
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://your-project.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key'
);

async function testRapideWorkflow() {
  console.log('⚡ Test rapide des points critiques...');
  
  const results = {
    config: false,
    database: false,
    functions: false,
    auth: false,
    guidance: false,
    chat: false
  };
  
  try {
    // 1. Test de configuration
    console.log('\n🔧 Test de configuration...');
    const requiredVars = ['SUPABASE_URL', 'OPENAI_API_KEY', 'BREVO_API_KEY'];
    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length === 0) {
      console.log('✅ Configuration OK');
      results.config = true;
    } else {
      console.log('❌ Variables manquantes:', missingVars);
    }
    
    // 2. Test de base de données
    console.log('\n🗄️ Test de base de données...');
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);
      
      if (!error) {
        console.log('✅ Base de données accessible');
        results.database = true;
      } else {
        console.log('❌ Erreur DB:', error.message);
      }
    } catch (dbError) {
      console.log('❌ Erreur connexion DB:', dbError.message);
    }
    
    // 3. Test des fonctions critiques
    console.log('\n⚙️ Test des fonctions critiques...');
    const appUrl = process.env.URL || 'https://zodiak.netlify.app';
    const criticalFunctions = [
      'send-sms',
      'generate-guidance',
      'astro-chatbot'
    ];
    
    let functionsOk = 0;
    for (const funcName of criticalFunctions) {
      try {
        const response = await fetch(`${appUrl}/.netlify/functions/${funcName}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ test: true })
        });
        
        if (response.status !== 500) {
          console.log(`✅ ${funcName} accessible`);
          functionsOk++;
        } else {
          console.log(`⚠️ ${funcName} erreur ${response.status}`);
        }
      } catch (funcError) {
        console.log(`❌ ${funcName}:`, funcError.message);
      }
    }
    
    if (functionsOk >= 2) {
      console.log('✅ Fonctions critiques OK');
      results.functions = true;
    }
    
    // 4. Test d'authentification
    console.log('\n🔐 Test d\'authentification...');
    try {
      const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
      
      if (!authError) {
        console.log('✅ Authentification OK');
        results.auth = true;
      } else {
        console.log('❌ Erreur auth:', authError.message);
      }
    } catch (authTestError) {
      console.log('❌ Erreur test auth:', authTestError.message);
    }
    
    // 5. Test de guidance
    console.log('\n🌟 Test de guidance...');
    try {
      const testDate = new Date().toISOString().slice(0, 10);
      const { data: guidanceData, error: guidanceError } = await supabase
        .from('guidance_cache')
        .select('*')
        .eq('cache_key', `test_${testDate}`)
        .maybeSingle();
      
      if (!guidanceError) {
        console.log('✅ Guidance accessible');
        results.guidance = true;
      } else {
        console.log('⚠️ Guidance:', guidanceError.message);
      }
    } catch (guidanceTestError) {
      console.log('❌ Erreur test guidance:', guidanceTestError.message);
    }
    
    // 6. Test de chat
    console.log('\n💬 Test de chat...');
    try {
      const { data: chatData, error: chatError } = await supabase
        .from('conversations')
        .select('*')
        .limit(1);
      
      if (!chatError) {
        console.log('✅ Chat accessible');
        results.chat = true;
      } else {
        console.log('⚠️ Chat:', chatError.message);
      }
    } catch (chatTestError) {
      console.log('❌ Erreur test chat:', chatTestError.message);
    }
    
    // Résumé
    console.log('\n📊 Résumé des tests:');
    console.log(`Configuration: ${results.config ? '✅' : '❌'}`);
    console.log(`Base de données: ${results.database ? '✅' : '❌'}`);
    console.log(`Fonctions: ${results.functions ? '✅' : '❌'}`);
    console.log(`Authentification: ${results.auth ? '✅' : '❌'}`);
    console.log(`Guidance: ${results.guidance ? '✅' : '❌'}`);
    console.log(`Chat: ${results.chat ? '✅' : '❌'}`);
    
    const successCount = Object.values(results).filter(Boolean).length;
    const totalCount = Object.keys(results).length;
    
    console.log(`\n🎯 Score: ${successCount}/${totalCount} (${Math.round(successCount/totalCount*100)}%)`);
    
    if (successCount >= 5) {
      console.log('🎉 Application prête pour les tests manuels !');
    } else if (successCount >= 3) {
      console.log('⚠️ Application partiellement fonctionnelle, vérification manuelle requise');
    } else {
      console.log('❌ Problèmes critiques détectés, correction nécessaire');
    }
    
  } catch (error) {
    console.log('❌ Erreur générale:', error.message);
  }
}

testRapideWorkflow(); 