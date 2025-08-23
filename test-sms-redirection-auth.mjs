import fetch from 'node-fetch';

const NETLIFY_URL = 'https://zodiakv2.netlify.app';

console.log('🔍 TEST AUTHENTIFICATION - LIENS SMS');
console.log('====================================\n');

async function testAuthenticationFlow() {
  try {
    // 1. Test de la page d'accueil pour voir si elle redirige vers login
    console.log('1️⃣ Test de la page d\'accueil...');
    
    const homeResponse = await fetch(`${NETLIFY_URL}/`);
    console.log('📊 Status page d\'accueil:', homeResponse.status);
    
    if (homeResponse.ok) {
      const homeHtml = await homeResponse.text();
      if (homeHtml.includes('login') || homeHtml.includes('Login')) {
        console.log('✅ Page d\'accueil redirige vers login (normal si non authentifié)');
      } else {
        console.log('⚠️ Page d\'accueil ne redirige pas vers login');
      }
    }

    // 2. Test de la page de redirection avec un User-Agent mobile
    console.log('\n2️⃣ Test de la page /g/TEST123 avec User-Agent mobile...');
    
    const mobileResponse = await fetch(`${NETLIFY_URL}/g/TEST123`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
      }
    });
    
    console.log('📊 Status /g/TEST123 (mobile):', mobileResponse.status);
    
    if (mobileResponse.ok) {
      const mobileHtml = await mobileResponse.text();
      console.log('📄 Taille du contenu HTML (mobile):', mobileHtml.length, 'caractères');
      
      if (mobileHtml.includes('GuidanceShortRedirect')) {
        console.log('✅ Composant GuidanceShortRedirect détecté (mobile)');
      } else {
        console.log('❌ Composant GuidanceShortRedirect NON détecté (mobile)');
      }
      
      if (mobileHtml.includes('Redirection vers la guidance')) {
        console.log('✅ Message de redirection détecté (mobile)');
      } else {
        console.log('❌ Message de redirection NON détecté (mobile)');
      }
    }

    // 3. Test avec un short code plus réaliste
    console.log('\n3️⃣ Test avec un short code réaliste...');
    
    const realisticResponse = await fetch(`${NETLIFY_URL}/g/ABC123`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
      }
    });
    
    console.log('📊 Status /g/ABC123 (mobile):', realisticResponse.status);
    
    if (realisticResponse.ok) {
      const realisticHtml = await realisticResponse.text();
      if (realisticHtml.includes('error=notfound')) {
        console.log('✅ Redirection vers erreur pour ABC123');
      } else {
        console.log('⚠️ Comportement inattendu pour ABC123');
      }
    }

    // 4. Test de la page guidance/access directement
    console.log('\n4️⃣ Test direct de /guidance/access...');
    
    const accessResponse = await fetch(`${NETLIFY_URL}/guidance/access?error=notfound`);
    console.log('📊 Status /guidance/access:', accessResponse.status);
    
    if (accessResponse.ok) {
      const accessHtml = await accessResponse.text();
      if (accessHtml.includes('Lien invalide')) {
        console.log('✅ Page d\'erreur guidance/access fonctionnelle');
      } else {
        console.log('❌ Page d\'erreur guidance/access non fonctionnelle');
      }
    }

  } catch (error) {
    console.error('❌ ERREUR lors du test:', error.message);
  }
}

async function testSupabasePermissions() {
  console.log('\n5️⃣ Test des permissions Supabase...');
  
  try {
    // Tester une fonction qui utilise Supabase
    const response = await fetch(`${NETLIFY_URL}/.netlify/functions/track-sms?shortCode=test&token=test&action=test`);
    console.log('📊 Status track-sms:', response.status);
    
    if (response.status === 400) {
      console.log('✅ Fonction track-sms accessible (erreur 400 normale)');
    } else if (response.status === 500) {
      console.log('❌ Erreur 500 - Problème avec Supabase ou variables d\'environnement');
    } else {
      console.log('⚠️ Statut inattendu:', response.status);
    }
  } catch (error) {
    console.error('❌ ERREUR connexion Supabase:', error.message);
  }
}

// Exécuter les tests
async function runAuthTests() {
  await testAuthenticationFlow();
  await testSupabasePermissions();
  
  console.log('\n🎯 DIAGNOSTIC AUTHENTIFICATION');
  console.log('===============================');
  console.log('Le problème semble être que:');
  console.log('1. La page /g/:short se charge (Status 200)');
  console.log('2. Mais le composant GuidanceShortRedirect ne s\'exécute pas');
  console.log('3. Cela peut être dû à:');
  console.log('   - Redirection automatique vers login avant chargement du composant');
  console.log('   - Erreur JavaScript qui empêche l\'exécution');
  console.log('   - Problème de routage React');
  console.log('   - Variables d\'environnement manquantes');
  
  console.log('\n💡 SOLUTIONS POSSIBLES:');
  console.log('1. Vérifier que la route /g/:short n\'est pas protégée par authentification');
  console.log('2. Tester avec un vrai lien SMS reçu sur mobile');
  console.log('3. Vérifier les logs JavaScript dans le navigateur');
  console.log('4. Vérifier les variables d\'environnement Supabase');
  console.log('5. Tester en mode développement local');
}

runAuthTests().catch(console.error);
