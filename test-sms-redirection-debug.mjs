import fetch from 'node-fetch';

const NETLIFY_URL = 'https://zodiakv2.netlify.app';

console.log('🔍 DEBUG - PROBLÈME REDIRECTION LIENS SMS');
console.log('========================================\n');

async function testRedirectionDebug() {
  try {
    // 1. Test de la page de redirection et analyse du contenu
    console.log('1️⃣ Test de la page /g/TEST123 avec analyse du contenu...');
    
    const response = await fetch(`${NETLIFY_URL}/g/TEST123`);
    console.log('📊 Status:', response.status);
    
    if (response.ok) {
      const html = await response.text();
      console.log('📄 Taille du contenu HTML:', html.length, 'caractères');
      
      // Analyser le contenu pour comprendre ce qui se passe
      if (html.includes('GuidanceShortRedirect')) {
        console.log('✅ Composant GuidanceShortRedirect détecté');
      } else {
        console.log('❌ Composant GuidanceShortRedirect NON détecté');
      }
      
      if (html.includes('Redirection vers la guidance')) {
        console.log('✅ Message de redirection détecté');
      } else {
        console.log('❌ Message de redirection NON détecté');
      }
      
      if (html.includes('error=notfound')) {
        console.log('✅ Redirection vers page d\'erreur détectée');
      } else {
        console.log('❌ Redirection vers page d\'erreur NON détectée');
      }
      
      if (html.includes('LoadingScreen')) {
        console.log('✅ Écran de chargement détecté');
      } else {
        console.log('❌ Écran de chargement NON détecté');
      }
      
      // Extraire les scripts pour voir s'il y a des erreurs JavaScript
      const scriptMatches = html.match(/<script[^>]*>[\s\S]*?<\/script>/g);
      if (scriptMatches) {
        console.log('📜 Scripts détectés:', scriptMatches.length);
      }
      
      // Chercher des erreurs dans le HTML
      if (html.includes('error') || html.includes('Error')) {
        console.log('⚠️ Erreurs détectées dans le HTML');
      }
      
      // Afficher un extrait du contenu pour debug
      console.log('🔍 Extrait du contenu HTML (premiers 500 caractères):');
      console.log(html.substring(0, 500));
    }

    // 2. Test avec un short code qui pourrait exister
    console.log('\n2️⃣ Test avec un short code plus réaliste...');
    
    const response2 = await fetch(`${NETLIFY_URL}/g/ABC123`);
    console.log('📊 Status ABC123:', response2.status);
    
    if (response2.ok) {
      const html2 = await response2.text();
      if (html2.includes('error=notfound')) {
        console.log('✅ Redirection vers erreur pour ABC123');
      } else {
        console.log('⚠️ Comportement inattendu pour ABC123');
      }
    }

    // 3. Test de la page guidance/access avec différents paramètres
    console.log('\n3️⃣ Test de la page guidance/access...');
    
    const accessResponse = await fetch(`${NETLIFY_URL}/guidance/access?error=notfound`);
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

async function testSupabaseConnection() {
  console.log('\n4️⃣ Test de la connexion Supabase...');
  
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
async function runDebugTests() {
  await testRedirectionDebug();
  await testSupabaseConnection();
  
  console.log('\n🎯 DIAGNOSTIC FINAL');
  console.log('===================');
  console.log('Le problème semble être que:');
  console.log('1. La page /g/:short se charge correctement (Status 200)');
  console.log('2. Mais le composant GuidanceShortRedirect ne redirige pas');
  console.log('3. Cela peut être dû à:');
  console.log('   - Erreur JavaScript dans le navigateur');
  console.log('   - Problème de permissions Supabase');
  console.log('   - Variables d\'environnement manquantes');
  console.log('   - Erreur dans la logique de redirection');
  
  console.log('\n💡 SOLUTIONS POSSIBLES:');
  console.log('1. Vérifier les logs du navigateur lors du clic sur un lien SMS');
  console.log('2. Vérifier les variables d\'environnement Supabase');
  console.log('3. Tester avec un vrai short code généré par un SMS');
  console.log('4. Vérifier les permissions RLS sur la table guidance_token');
}

runDebugTests().catch(console.error);
