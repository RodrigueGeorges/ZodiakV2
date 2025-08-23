import fetch from 'node-fetch';

const LOCAL_URL = 'http://localhost:5173';
const NETLIFY_URL = 'https://zodiakv2.netlify.app';

console.log('🔍 TEST LOCAL - REDIRECTION LIENS SMS');
console.log('=====================================\n');

async function testLocalRedirection() {
  try {
    // 1. Test local si le serveur de développement est en cours
    console.log('1️⃣ Test local (serveur de développement)...');
    
    try {
      const localResponse = await fetch(`${LOCAL_URL}/g/TEST123`, {
        method: 'GET',
        timeout: 3000
      });
      
      console.log('📊 Status local:', localResponse.status);
      
      if (localResponse.ok) {
        const localHtml = await localResponse.text();
        console.log('📄 Taille du contenu HTML local:', localHtml.length, 'caractères');
        
        if (localHtml.includes('GuidanceShortRedirect')) {
          console.log('✅ Composant GuidanceShortRedirect détecté (local)');
        } else {
          console.log('❌ Composant GuidanceShortRedirect NON détecté (local)');
        }
        
        if (localHtml.includes('Redirection vers la guidance')) {
          console.log('✅ Message de redirection détecté (local)');
        } else {
          console.log('❌ Message de redirection NON détecté (local)');
        }
      }
    } catch (localError) {
      console.log('⚠️ Serveur local non accessible:', localError.message);
    }

    // 2. Test Netlify (production)
    console.log('\n2️⃣ Test Netlify (production)...');
    
    const netlifyResponse = await fetch(`${NETLIFY_URL}/g/TEST123`);
    console.log('📊 Status Netlify:', netlifyResponse.status);
    
    if (netlifyResponse.ok) {
      const netlifyHtml = await netlifyResponse.text();
      console.log('📄 Taille du contenu HTML Netlify:', netlifyHtml.length, 'caractères');
      
      if (netlifyHtml.includes('GuidanceShortRedirect')) {
        console.log('✅ Composant GuidanceShortRedirect détecté (Netlify)');
      } else {
        console.log('❌ Composant GuidanceShortRedirect NON détecté (Netlify)');
      }
      
      if (netlifyHtml.includes('Redirection vers la guidance')) {
        console.log('✅ Message de redirection détecté (Netlify)');
      } else {
        console.log('❌ Message de redirection NON détecté (Netlify)');
      }
      
      // Chercher des indices de ce qui se charge à la place
      if (netlifyHtml.includes('Home')) {
        console.log('⚠️ Page d\'accueil détectée (redirection vers login ?)');
      }
      
      if (netlifyHtml.includes('Login')) {
        console.log('⚠️ Page de connexion détectée (redirection automatique ?)');
      }
      
      if (netlifyHtml.includes('LoadingScreen')) {
        console.log('✅ Écran de chargement détecté');
      }
    }

    // 3. Test avec un short code plus réaliste
    console.log('\n3️⃣ Test avec un short code réaliste...');
    
    const realisticResponse = await fetch(`${NETLIFY_URL}/g/ABC123`);
    console.log('📊 Status ABC123:', realisticResponse.status);
    
    if (realisticResponse.ok) {
      const realisticHtml = await realisticResponse.text();
      if (realisticHtml.includes('error=notfound')) {
        console.log('✅ Redirection vers erreur pour ABC123');
      } else {
        console.log('⚠️ Comportement inattendu pour ABC123');
      }
    }

  } catch (error) {
    console.error('❌ ERREUR lors du test:', error.message);
  }
}

async function testGuidanceAccess() {
  console.log('\n4️⃣ Test de la page guidance/access...');
  
  try {
    const accessResponse = await fetch(`${NETLIFY_URL}/guidance/access?error=notfound`);
    console.log('📊 Status guidance/access:', accessResponse.status);
    
    if (accessResponse.ok) {
      const accessHtml = await accessResponse.text();
      if (accessHtml.includes('Lien invalide')) {
        console.log('✅ Page d\'erreur guidance/access fonctionnelle');
      } else {
        console.log('❌ Page d\'erreur guidance/access non fonctionnelle');
      }
    }
  } catch (error) {
    console.error('❌ ERREUR guidance/access:', error.message);
  }
}

// Exécuter les tests
async function runLocalTests() {
  await testLocalRedirection();
  await testGuidanceAccess();
  
  console.log('\n🎯 DIAGNOSTIC LOCAL');
  console.log('===================');
  console.log('Le problème semble être que:');
  console.log('1. Les modifications ne sont pas encore déployées sur Netlify');
  console.log('2. Il faut déployer les changements pour qu\'ils prennent effet');
  console.log('3. Les liens SMS devraient fonctionner après le déploiement');
  
  console.log('\n💡 PROCHAINES ÉTAPES:');
  console.log('1. Déployer les modifications sur Netlify');
  console.log('2. Tester avec un vrai lien SMS');
  console.log('3. Vérifier que la redirection fonctionne');
  console.log('4. Tester sur mobile avec un vrai SMS reçu');
}

runLocalTests().catch(console.error);
