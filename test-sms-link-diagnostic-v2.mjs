import fetch from 'node-fetch';

const NETLIFY_URL = 'https://zodiakv2.netlify.app';

console.log('🔍 DIAGNOSTIC DES LIENS SMS - VERSION 2');
console.log('=====================================\n');

async function testSmsSystem() {
  try {
    console.log('1️⃣ Test de la fonction send-test-sms...');
    
    const testSmsResponse = await fetch(`${NETLIFY_URL}/.netlify/functions/send-test-sms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone: '+33600000000', // Numéro de test
        userId: 'test-user-id',
        name: 'Test User'
      })
    });

    console.log('📊 Status:', testSmsResponse.status);
    console.log('📊 Headers:', Object.fromEntries(testSmsResponse.headers.entries()));

    if (testSmsResponse.ok) {
      const testSmsData = await testSmsResponse.json();
      console.log('✅ Réponse send-test-sms:', JSON.stringify(testSmsData, null, 2));
      
      // Extraire le short code de la réponse
      const shortCode = testSmsData.shortCode || testSmsData.short_code;
      if (shortCode) {
        console.log(`\n2️⃣ Test du lien généré: /g/${shortCode}`);
        
        // Tester la redirection
        const redirectResponse = await fetch(`${NETLIFY_URL}/g/${shortCode}`, {
          method: 'GET',
          redirect: 'manual' // Ne pas suivre automatiquement les redirections
        });
        
        console.log('📊 Status redirection:', redirectResponse.status);
        console.log('📊 Headers redirection:', Object.fromEntries(redirectResponse.headers.entries()));
        
        if (redirectResponse.headers.get('location')) {
          console.log('📍 Redirection vers:', redirectResponse.headers.get('location'));
        }
        
        // Tester la page de destination
        const finalUrl = redirectResponse.headers.get('location') || `${NETLIFY_URL}/g/${shortCode}`;
        const finalResponse = await fetch(finalUrl, {
          method: 'GET'
        });
        
        console.log('📊 Status page finale:', finalResponse.status);
        
        if (finalResponse.ok) {
          const html = await finalResponse.text();
          if (html.includes('error=notfound')) {
            console.log('❌ ERREUR: Page finale contient error=notfound');
            console.log('🔍 Extrait HTML:', html.substring(0, 500));
          } else if (html.includes('token=')) {
            console.log('✅ SUCCÈS: Token trouvé dans la page finale');
          } else {
            console.log('⚠️ ATTENTION: Page finale ne contient ni erreur ni token');
          }
        }
      } else {
        console.log('❌ ERREUR: Aucun short code dans la réponse');
      }
    } else {
      const errorText = await testSmsResponse.text();
      console.log('❌ ERREUR send-test-sms:', errorText);
    }

  } catch (error) {
    console.error('❌ ERREUR lors du test:', error.message);
  }
}

async function testDirectAccess() {
  console.log('\n3️⃣ Test d\'accès direct à la page guidance/access...');
  
  try {
    const response = await fetch(`${NETLIFY_URL}/guidance/access?error=notfound`);
    console.log('📊 Status:', response.status);
    
    if (response.ok) {
      const html = await response.text();
      console.log('✅ Page accessible');
      console.log('🔍 Contenu de la page:');
      console.log(html.substring(0, 1000));
    } else {
      console.log('❌ Page non accessible');
    }
  } catch (error) {
    console.error('❌ ERREUR accès direct:', error.message);
  }
}

async function testNetlifyFunctions() {
  console.log('\n4️⃣ Test des fonctions Netlify...');
  
  const functions = [
    'send-test-sms',
    'track-sms',
    'generate-guidance'
  ];
  
  for (const func of functions) {
    try {
      console.log(`\n🔧 Test de ${func}...`);
      const response = await fetch(`${NETLIFY_URL}/.netlify/functions/${func}`, {
        method: 'GET'
      });
      
      console.log(`📊 Status ${func}:`, response.status);
      
      if (response.ok) {
        const data = await response.text();
        console.log(`✅ ${func} accessible`);
      } else {
        console.log(`❌ ${func} non accessible`);
      }
    } catch (error) {
      console.error(`❌ ERREUR ${func}:`, error.message);
    }
  }
}

// Exécuter les tests
async function runAllTests() {
  await testSmsSystem();
  await testDirectAccess();
  await testNetlifyFunctions();
  
  console.log('\n🎯 DIAGNOSTIC TERMINÉ');
  console.log('====================');
  console.log('📋 Résumé des problèmes potentiels:');
  console.log('1. Vérifier que la fonction send-test-sms génère bien un short code');
  console.log('2. Vérifier que le short code est bien inséré dans la table guidance_token');
  console.log('3. Vérifier que la redirection /g/:short fonctionne correctement');
  console.log('4. Vérifier que la page GuidanceAccess peut lire le token');
}

runAllTests().catch(console.error);
