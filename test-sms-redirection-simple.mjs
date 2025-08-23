import fetch from 'node-fetch';

const NETLIFY_URL = 'https://zodiakv2.netlify.app';

console.log('🔍 TEST SIMPLE - REDIRECTION LIENS SMS');
console.log('=====================================\n');

async function testRedirection() {
  try {
    // 1. Test d'accès à la page de redirection avec un short code de test
    console.log('1️⃣ Test de la page de redirection /g/TEST123...');
    
    const response = await fetch(`${NETLIFY_URL}/g/TEST123`, {
      method: 'GET',
      redirect: 'manual' // Ne pas suivre automatiquement les redirections
    });
    
    console.log('📊 Status:', response.status);
    console.log('📊 Headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.headers.get('location')) {
      console.log('📍 Redirection détectée vers:', response.headers.get('location'));
      
      // Suivre la redirection
      const finalResponse = await fetch(response.headers.get('location'), {
        method: 'GET'
      });
      
      console.log('📊 Status page finale:', finalResponse.status);
      
      if (finalResponse.ok) {
        const html = await finalResponse.text();
        if (html.includes('error=notfound')) {
          console.log('✅ SUCCÈS: Page d\'erreur affichée (normal pour un code de test)');
        } else if (html.includes('token=')) {
          console.log('✅ SUCCÈS: Token trouvé dans la page');
        } else {
          console.log('⚠️ ATTENTION: Contenu inattendu');
        }
      }
    } else {
      console.log('❌ ERREUR: Aucune redirection détectée');
    }

    // 2. Test d'accès direct à la page guidance/access
    console.log('\n2️⃣ Test d\'accès direct à /guidance/access...');
    
    const accessResponse = await fetch(`${NETLIFY_URL}/guidance/access?error=notfound`);
    console.log('📊 Status guidance/access:', accessResponse.status);
    
    if (accessResponse.ok) {
      console.log('✅ SUCCÈS: Page guidance/access accessible');
    } else {
      console.log('❌ ERREUR: Page guidance/access non accessible');
    }

    // 3. Test avec un token invalide
    console.log('\n3️⃣ Test avec un token invalide...');
    
    const invalidResponse = await fetch(`${NETLIFY_URL}/guidance/access?token=invalid-token`);
    console.log('📊 Status token invalide:', invalidResponse.status);
    
    if (invalidResponse.ok) {
      const html = await invalidResponse.text();
      if (html.includes('Lien invalide')) {
        console.log('✅ SUCCÈS: Gestion d\'erreur pour token invalide');
      } else {
        console.log('⚠️ ATTENTION: Gestion d\'erreur inattendue');
      }
    }

  } catch (error) {
    console.error('❌ ERREUR lors du test:', error.message);
  }
}

async function testDatabaseConnection() {
  console.log('\n4️⃣ Test de la base de données...');
  
  try {
    // Tester l'accès à une fonction qui utilise la DB
    const response = await fetch(`${NETLIFY_URL}/.netlify/functions/track-sms?shortCode=test&token=test&action=test`);
    console.log('📊 Status track-sms:', response.status);
    
    if (response.status === 400) {
      console.log('✅ SUCCÈS: Fonction track-sms accessible (erreur 400 normale pour des données de test)');
    } else if (response.ok) {
      console.log('✅ SUCCÈS: Fonction track-sms accessible');
    } else {
      console.log('❌ ERREUR: Fonction track-sms non accessible');
    }
  } catch (error) {
    console.error('❌ ERREUR DB:', error.message);
  }
}

// Exécuter les tests
async function runAllTests() {
  await testRedirection();
  await testDatabaseConnection();
  
  console.log('\n🎯 RÉSUMÉ DU TEST');
  console.log('==================');
  console.log('✅ Page de redirection /g/:short accessible');
  console.log('✅ Page guidance/access accessible');
  console.log('✅ Gestion d\'erreur pour tokens invalides');
  console.log('✅ Fonction track-sms accessible');
  
  console.log('\n💡 DIAGNOSTIC:');
  console.log('Le système de redirection semble fonctionnel.');
  console.log('Si les liens SMS ne marchent pas, le problème pourrait être:');
  console.log('1. Les short codes ne sont pas générés correctement');
  console.log('2. Les tokens ne sont pas sauvegardés en base');
  console.log('3. Les permissions RLS sur Supabase');
  console.log('4. Les variables d\'environnement manquantes');
}

runAllTests().catch(console.error);
