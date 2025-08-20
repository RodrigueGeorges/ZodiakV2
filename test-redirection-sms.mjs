import fetch from 'node-fetch';

const NETLIFY_URL = 'https://zodiakv2.netlify.app';

console.log('🔍 DIAGNOSTIC REDIRECTION SMS');
console.log('============================\n');

async function testRedirection() {
  try {
    console.log('1️⃣ Test de génération d\'un lien SMS...');
    
    // Utiliser un numéro valide pour Brevo
    const testSmsResponse = await fetch(`${NETLIFY_URL}/.netlify/functions/send-test-sms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone: '+33612345678', // Numéro de test valide
        userId: 'test-user-id',
        name: 'Test User'
      })
    });

    console.log('📊 Status SMS:', testSmsResponse.status);

    if (testSmsResponse.ok) {
      const testSmsData = await testSmsResponse.json();
      console.log('✅ SMS envoyé avec succès');
      console.log('📋 Données de réponse:', JSON.stringify(testSmsData, null, 2));
      
      // Extraire le short code
      const shortCode = testSmsData.shortCode || testSmsData.short_code;
      
      if (shortCode) {
        console.log(`\n2️⃣ Test de redirection: /g/${shortCode}`);
        
        // Test 1: Accès direct au lien court
        const shortLinkResponse = await fetch(`${NETLIFY_URL}/g/${shortCode}`, {
          method: 'GET',
          redirect: 'manual' // Ne pas suivre automatiquement
        });
        
        console.log('📊 Status lien court:', shortLinkResponse.status);
        console.log('📊 Headers:', Object.fromEntries(shortLinkResponse.headers.entries()));
        
        // Vérifier s'il y a une redirection
        const location = shortLinkResponse.headers.get('location');
        if (location) {
          console.log('📍 Redirection détectée vers:', location);
          
          // Test 2: Suivre la redirection
          const finalResponse = await fetch(location, {
            method: 'GET'
          });
          
          console.log('📊 Status page finale:', finalResponse.status);
          
          if (finalResponse.ok) {
            const html = await finalResponse.text();
            
            // Analyser le contenu
            if (html.includes('error=notfound')) {
              console.log('❌ ERREUR: Page contient error=notfound');
              console.log('🔍 URL finale:', finalResponse.url);
            } else if (html.includes('token=')) {
              console.log('✅ SUCCÈS: Token trouvé dans la page');
              console.log('🔍 URL finale:', finalResponse.url);
            } else if (html.includes('guidance')) {
              console.log('✅ SUCCÈS: Page de guidance chargée');
              console.log('🔍 URL finale:', finalResponse.url);
            } else {
              console.log('⚠️ ATTENTION: Contenu inattendu');
              console.log('🔍 Extrait HTML:', html.substring(0, 300));
            }
          } else {
            console.log('❌ ERREUR: Page finale non accessible');
          }
        } else {
          console.log('❌ ERREUR: Aucune redirection détectée');
          
          // Tester le contenu de la page /g/:short
          const html = await shortLinkResponse.text();
          console.log('🔍 Contenu de /g/:short:', html.substring(0, 500));
        }
      } else {
        console.log('❌ ERREUR: Aucun short code dans la réponse');
      }
    } else {
      const errorText = await testSmsResponse.text();
      console.log('❌ ERREUR SMS:', errorText);
    }

  } catch (error) {
    console.error('❌ ERREUR lors du test:', error.message);
  }
}

async function testDatabaseConnection() {
  console.log('\n3️⃣ Test de la base de données...');
  
  try {
    // Tester l'accès à la fonction track-sms (qui utilise la DB)
    const trackResponse = await fetch(`${NETLIFY_URL}/.netlify/functions/track-sms?shortCode=test&token=test&action=test`, {
      method: 'GET'
    });
    
    console.log('📊 Status track-sms:', trackResponse.status);
    
    if (trackResponse.ok) {
      const data = await trackResponse.text();
      console.log('✅ Fonction track-sms accessible');
    } else {
      console.log('❌ Fonction track-sms non accessible');
    }
  } catch (error) {
    console.error('❌ ERREUR DB:', error.message);
  }
}

async function testGuidanceAccessPage() {
  console.log('\n4️⃣ Test de la page GuidanceAccess...');
  
  try {
    // Test avec un token valide
    const response = await fetch(`${NETLIFY_URL}/guidance/access?token=test-token`, {
      method: 'GET'
    });
    
    console.log('📊 Status GuidanceAccess:', response.status);
    
    if (response.ok) {
      const html = await response.text();
      if (html.includes('Lien invalide')) {
        console.log('✅ Page GuidanceAccess fonctionne (affiche erreur pour token invalide)');
      } else {
        console.log('⚠️ Contenu inattendu de GuidanceAccess');
      }
    } else {
      console.log('❌ Page GuidanceAccess non accessible');
    }
  } catch (error) {
    console.error('❌ ERREUR GuidanceAccess:', error.message);
  }
}

// Exécuter les tests
async function runAllTests() {
  await testRedirection();
  await testDatabaseConnection();
  await testGuidanceAccessPage();
  
  console.log('\n🎯 DIAGNOSTIC TERMINÉ');
  console.log('====================');
  console.log('📋 Prochaines étapes:');
  console.log('1. Vérifier que le short code est bien dans la table guidance_token');
  console.log('2. Vérifier que la redirection /g/:short fonctionne');
  console.log('3. Vérifier que GuidanceShortRedirect peut lire la DB');
  console.log('4. Vérifier que GuidanceAccess peut valider le token');
}

runAllTests().catch(console.error);
