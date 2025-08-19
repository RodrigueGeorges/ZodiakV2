#!/usr/bin/env node

import { randomUUID } from 'crypto';

// Configuration - Test via les fonctions Netlify
const NETLIFY_URL = 'https://zodiakv2.netlify.app';

// Fonction pour générer un code court
function generateShortCode(length = 6) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

async function testSmsLinkSystem() {
  console.log('🔍 Diagnostic du système de liens SMS via Netlify...\n');

  try {
    // 1. Tester l'envoi d'un SMS de test
    console.log('1️⃣ Test d\'envoi de SMS de test...');
    const testSmsUrl = `${NETLIFY_URL}/.netlify/functions/send-test-sms`;
    
    try {
      const response = await fetch(testSmsUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({})
      });
      
      const result = await response.json();
      
      if (response.ok) {
        console.log('✅ SMS de test envoyé avec succès');
        console.log('📱 Résultat:', result);
        
        // Extraire le short code du résultat si disponible
        if (result.shortCode) {
          console.log('🔗 Short code généré:', result.shortCode);
          await testShortLink(result.shortCode);
        }
      } else {
        console.error('❌ Erreur envoi SMS de test:', result);
      }
    } catch (error) {
      console.error('❌ Erreur lors du test SMS:', error.message);
    }

    // 2. Tester la fonction de génération de guidance
    console.log('\n2️⃣ Test de génération de guidance...');
    const generateGuidanceUrl = `${NETLIFY_URL}/.netlify/functions/generate-guidance`;
    
    try {
      const response = await fetch(generateGuidanceUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({})
      });
      
      const result = await response.json();
      
      if (response.ok) {
        console.log('✅ Génération de guidance réussie');
        console.log('📊 Résultat:', result);
      } else {
        console.error('❌ Erreur génération guidance:', result);
      }
    } catch (error) {
      console.error('❌ Erreur lors de la génération de guidance:', error.message);
    }

    // 3. Tester l'envoi de guidance SMS
    console.log('\n3️⃣ Test d\'envoi de guidance SMS...');
    const sendGuidanceUrl = `${NETLIFY_URL}/.netlify/functions/send-guidance-sms`;
    
    try {
      const response = await fetch(sendGuidanceUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({})
      });
      
      const result = await response.json();
      
      if (response.ok) {
        console.log('✅ Envoi de guidance SMS réussi');
        console.log('📱 Résultat:', result);
      } else {
        console.error('❌ Erreur envoi guidance SMS:', result);
      }
    } catch (error) {
      console.error('❌ Erreur lors de l\'envoi de guidance SMS:', error.message);
    }

    // 4. Tester l'envoi de guidance quotidienne
    console.log('\n4️⃣ Test d\'envoi de guidance quotidienne...');
    const dailyGuidanceUrl = `${NETLIFY_URL}/.netlify/functions/send-daily-guidance`;
    
    try {
      const response = await fetch(dailyGuidanceUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({})
      });
      
      const result = await response.json();
      
      if (response.ok) {
        console.log('✅ Envoi de guidance quotidienne réussi');
        console.log('📊 Résultat:', result);
      } else {
        console.error('❌ Erreur envoi guidance quotidienne:', result);
      }
    } catch (error) {
      console.error('❌ Erreur lors de l\'envoi de guidance quotidienne:', error.message);
    }

    // 5. Test de la page de redirection
    console.log('\n5️⃣ Test de la page de redirection...');
    const testShortCode = 'TEST123';
    const redirectUrl = `${NETLIFY_URL}/g/${testShortCode}`;
    
    try {
      const response = await fetch(redirectUrl, {
        method: 'GET',
        headers: {
          'Accept': 'text/html',
        },
        redirect: 'manual' // Ne pas suivre les redirections automatiquement
      });
      
      console.log('🔗 URL testée:', redirectUrl);
      console.log('📊 Status:', response.status);
      console.log('📊 Headers:', Object.fromEntries(response.headers.entries()));
      
      if (response.status === 200) {
        console.log('✅ Page de redirection accessible');
      } else if (response.status === 404) {
        console.log('⚠️ Page de redirection retourne 404 (normal pour un code de test)');
      } else {
        console.log('⚠️ Status inattendu:', response.status);
      }
    } catch (error) {
      console.error('❌ Erreur lors du test de redirection:', error.message);
    }

    // 6. Test de la page d'accès à la guidance
    console.log('\n6️⃣ Test de la page d\'accès à la guidance...');
    const testToken = 'test-token-123';
    const accessUrl = `${NETLIFY_URL}/guidance/access?token=${testToken}`;
    
    try {
      const response = await fetch(accessUrl, {
        method: 'GET',
        headers: {
          'Accept': 'text/html',
        },
        redirect: 'manual'
      });
      
      console.log('🔗 URL testée:', accessUrl);
      console.log('📊 Status:', response.status);
      
      if (response.status === 200) {
        console.log('✅ Page d\'accès à la guidance accessible');
      } else if (response.status === 404) {
        console.log('⚠️ Page d\'accès retourne 404 (normal pour un token de test)');
      } else {
        console.log('⚠️ Status inattendu:', response.status);
      }
    } catch (error) {
      console.error('❌ Erreur lors du test d\'accès:', error.message);
    }

    // 7. Test du système de tracking
    console.log('\n7️⃣ Test du système de tracking...');
    const trackingUrl = `${NETLIFY_URL}/.netlify/functions/track-sms?shortCode=TEST123&token=test-token&action=click`;
    
    try {
      const response = await fetch(trackingUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      const result = await response.json();
      
      if (response.ok) {
        console.log('✅ Système de tracking fonctionnel');
        console.log('📊 Résultat:', result);
      } else {
        console.log('⚠️ Erreur tracking (normal pour des données de test):', result);
      }
    } catch (error) {
      console.error('❌ Erreur lors du test de tracking:', error.message);
    }

    // 8. Résumé final
    console.log('\n📋 RÉSUMÉ DU DIAGNOSTIC');
    console.log('========================');
    console.log('✅ Tests des fonctions Netlify terminés');
    console.log('✅ Système de liens SMS testé');
    console.log('✅ Pages de redirection vérifiées');
    console.log('✅ Système de tracking testé');
    
    console.log('\n💡 PROCHAINES ÉTAPES:');
    console.log('1. Vérifiez les logs Netlify pour plus de détails');
    console.log('2. Testez avec un vrai SMS envoyé');
    console.log('3. Vérifiez la base de données pour les tokens');
    console.log('4. Testez sur mobile si possible');

  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
  }
}

async function testShortLink(shortCode) {
  console.log(`\n🔗 Test du lien court: ${shortCode}`);
  const shortLink = `${NETLIFY_URL}/g/${shortCode}`;
  console.log('URL complète:', shortLink);
  
  try {
    const response = await fetch(shortLink, {
      method: 'GET',
      headers: {
        'Accept': 'text/html',
      },
      redirect: 'manual'
    });
    
    console.log('Status:', response.status);
    console.log('Headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.status === 200) {
      console.log('✅ Lien court fonctionnel');
    } else {
      console.log('⚠️ Status inattendu:', response.status);
    }
  } catch (error) {
    console.error('❌ Erreur test lien court:', error.message);
  }
}

// Exécuter le diagnostic
testSmsLinkSystem().then(() => {
  console.log('\n🏁 Diagnostic terminé');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});
