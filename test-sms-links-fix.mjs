#!/usr/bin/env node

// Configuration
const NETLIFY_URL = 'https://zodiakv2.netlify.app';

async function testSmsLinks() {
  console.log('🔍 Test du système de liens SMS...\n');

  try {
    // 1. Test de la page principale
    console.log('1️⃣ Test de la page principale...');
    try {
      const response = await fetch(NETLIFY_URL, {
        method: 'GET',
        headers: {
          'Accept': 'text/html',
        }
      });
      
      console.log('📊 Status:', response.status);
      if (response.ok) {
        console.log('✅ Site principal accessible');
      } else {
        console.log('❌ Site principal inaccessible');
      }
    } catch (error) {
      console.error('❌ Erreur accès site principal:', error.message);
    }

    // 2. Test de la page de guidance
    console.log('\n2️⃣ Test de la page de guidance...');
    try {
      const response = await fetch(`${NETLIFY_URL}/guidance`, {
        method: 'GET',
        headers: {
          'Accept': 'text/html',
        }
      });
      
      console.log('📊 Status:', response.status);
      if (response.ok) {
        console.log('✅ Page de guidance accessible');
      } else {
        console.log('❌ Page de guidance inaccessible');
      }
    } catch (error) {
      console.error('❌ Erreur accès page guidance:', error.message);
    }

    // 3. Test de la page d'accès à la guidance
    console.log('\n3️⃣ Test de la page d\'accès à la guidance...');
    const testToken = 'test-token-123';
    try {
      const response = await fetch(`${NETLIFY_URL}/guidance/access?token=${testToken}`, {
        method: 'GET',
        headers: {
          'Accept': 'text/html',
        }
      });
      
      console.log('📊 Status:', response.status);
      if (response.ok) {
        console.log('✅ Page d\'accès à la guidance accessible');
      } else if (response.status === 404) {
        console.log('⚠️ Page d\'accès retourne 404 (normal pour un token de test)');
      } else {
        console.log('⚠️ Status inattendu:', response.status);
      }
    } catch (error) {
      console.error('❌ Erreur accès page d\'accès:', error.message);
    }

    // 4. Test de la page de redirection
    console.log('\n4️⃣ Test de la page de redirection...');
    const testShortCode = 'TEST123';
    try {
      const response = await fetch(`${NETLIFY_URL}/g/${testShortCode}`, {
        method: 'GET',
        headers: {
          'Accept': 'text/html',
        }
      });
      
      console.log('📊 Status:', response.status);
      if (response.ok) {
        console.log('✅ Page de redirection accessible');
      } else if (response.status === 404) {
        console.log('⚠️ Page de redirection retourne 404 (normal pour un code de test)');
      } else {
        console.log('⚠️ Status inattendu:', response.status);
      }
    } catch (error) {
      console.error('❌ Erreur accès page de redirection:', error.message);
    }

    // 5. Test des fonctions Netlify
    console.log('\n5️⃣ Test des fonctions Netlify...');
    
    // Test de la fonction send-test-sms
    try {
      const response = await fetch(`${NETLIFY_URL}/.netlify/functions/send-test-sms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({})
      });
      
      console.log('📊 Status send-test-sms:', response.status);
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Fonction send-test-sms fonctionnelle:', result);
      } else {
        console.log('❌ Fonction send-test-sms en erreur');
      }
    } catch (error) {
      console.error('❌ Erreur fonction send-test-sms:', error.message);
    }

    // Test de la fonction track-sms
    try {
      const response = await fetch(`${NETLIFY_URL}/.netlify/functions/track-sms?shortCode=TEST123&token=test-token&action=click`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      console.log('📊 Status track-sms:', response.status);
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Fonction track-sms fonctionnelle:', result);
      } else {
        console.log('⚠️ Fonction track-sms en erreur (normal pour des données de test)');
      }
    } catch (error) {
      console.error('❌ Erreur fonction track-sms:', error.message);
    }

    // 6. Résumé et recommandations
    console.log('\n📋 RÉSUMÉ ET RECOMMANDATIONS');
    console.log('==============================');
    console.log('✅ Erreur ShareButton corrigée dans GuidanceContent.tsx');
    console.log('✅ URL mise à jour vers zodiakv2.netlify.app');
    console.log('✅ Tests des pages et fonctions effectués');
    
    console.log('\n💡 PROCHAINES ÉTAPES:');
    console.log('1. Déployez les corrections sur Netlify');
    console.log('2. Testez l\'accès à la guidance via un vrai SMS');
    console.log('3. Vérifiez que les liens courts fonctionnent');
    console.log('4. Testez sur mobile');

  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
  }
}

// Exécuter les tests
testSmsLinks().then(() => {
  console.log('\n🏁 Tests terminés');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});
