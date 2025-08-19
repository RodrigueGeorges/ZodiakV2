#!/usr/bin/env node

// Configuration
const NETLIFY_URL = 'https://zodiakv2.netlify.app';

async function testSmsTokenDiagnostic() {
  console.log('🔍 Diagnostic des tokens SMS...\n');

  try {
    // 1. Test de la page de redirection avec un short code invalide
    console.log('1️⃣ Test avec un short code invalide...');
    try {
      const response = await fetch(`${NETLIFY_URL}/g/invalid-short-code`, {
        method: 'GET',
        headers: {
          'Accept': 'text/html',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      console.log('📊 Status:', response.status);
      
      if (response.status === 200) {
        const html = await response.text();
        
        // Vérifier si on est redirigé vers la page d'erreur
        if (html.includes('error=notfound') || html.includes('Lien invalide')) {
          console.log('✅ Redirection vers page d\'erreur correcte');
        } else {
          console.log('⚠️ Redirection inattendue');
        }
        
        // Vérifier le contenu de la page
        if (html.includes('Lien invalide') || html.includes('expiré')) {
          console.log('✅ Message d\'erreur affiché');
        } else {
          console.log('⚠️ Message d\'erreur non trouvé');
        }
        
      } else {
        console.log('❌ Page inaccessible');
      }
    } catch (error) {
      console.error('❌ Erreur accès page:', error.message);
    }

    // 2. Test de la page d'accès avec un token invalide
    console.log('\n2️⃣ Test avec un token invalide...');
    try {
      const response = await fetch(`${NETLIFY_URL}/guidance/access?token=invalid-token`, {
        method: 'GET',
        headers: {
          'Accept': 'text/html',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      console.log('📊 Status:', response.status);
      
      if (response.status === 200) {
        const html = await response.text();
        
        // Vérifier le message d'erreur
        if (html.includes('Lien invalide') || html.includes('expiré')) {
          console.log('✅ Message d\'erreur affiché');
        } else {
          console.log('⚠️ Message d\'erreur non trouvé');
        }
        
        // Vérifier le design
        if (html.includes('bg-cosmic-900')) {
          console.log('✅ Design sombre appliqué');
        } else {
          console.log('⚠️ Design sombre non trouvé');
        }
        
      } else {
        console.log('❌ Page inaccessible');
      }
    } catch (error) {
      console.error('❌ Erreur accès page:', error.message);
    }

    // 3. Test de la page d'accès sans token
    console.log('\n3️⃣ Test sans token...');
    try {
      const response = await fetch(`${NETLIFY_URL}/guidance/access`, {
        method: 'GET',
        headers: {
          'Accept': 'text/html',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      console.log('📊 Status:', response.status);
      
      if (response.status === 200) {
        const html = await response.text();
        
        if (html.includes('Lien invalide')) {
          console.log('✅ Message d\'erreur affiché');
        } else {
          console.log('⚠️ Message d\'erreur non trouvé');
        }
        
      } else {
        console.log('❌ Page inaccessible');
      }
    } catch (error) {
      console.error('❌ Erreur accès page:', error.message);
    }

    // 4. Test de la fonction de génération de SMS
    console.log('\n4️⃣ Test de la fonction de génération de SMS...');
    try {
      const response = await fetch(`${NETLIFY_URL}/.netlify/functions/send-test-sms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: '+33123456789',
          message: 'Test de génération de lien'
        })
      });
      
      console.log('📊 Status:', response.status);
      
      if (response.status === 200) {
        const data = await response.json();
        console.log('✅ Fonction accessible');
        console.log('📄 Réponse:', JSON.stringify(data, null, 2));
      } else {
        console.log('❌ Fonction inaccessible');
        const text = await response.text();
        console.log('📄 Réponse:', text.substring(0, 200));
      }
    } catch (error) {
      console.error('❌ Erreur fonction:', error.message);
    }

    // 5. Analyse du problème
    console.log('\n🔍 ANALYSE DU PROBLÈME');
    console.log('=====================');
    console.log('❌ PROBLÈME IDENTIFIÉ:');
    console.log('- Le lien SMS redirige vers /guidance/access?error=notfound');
    console.log('- Cela indique que le short_code n\'est pas trouvé dans la base');
    console.log('- Ou que le token a expiré');
    console.log('- Ou que la guidance n\'existe pas pour cette date');
    
    console.log('\n🔧 CAUSES POSSIBLES:');
    console.log('1. Le short_code dans le SMS est incorrect');
    console.log('2. Le token a expiré (24h)');
    console.log('3. La guidance n\'a pas été générée pour cette date');
    console.log('4. Problème de base de données');
    console.log('5. Problème de génération du lien SMS');
    
    console.log('\n💡 SOLUTIONS RECOMMANDÉES:');
    console.log('1. Vérifier la génération des liens SMS');
    console.log('2. Vérifier l\'expiration des tokens');
    console.log('3. Vérifier la génération des guidances quotidiennes');
    console.log('4. Tester avec un lien SMS valide');
    console.log('5. Vérifier les logs de la fonction send-daily-guidance');

  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
  }
}

// Exécuter les tests
testSmsTokenDiagnostic().then(() => {
  console.log('\n🏁 Diagnostic terminé');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});
