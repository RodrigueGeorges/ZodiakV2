import fetch from 'node-fetch';

const NETLIFY_URL = 'https://zodiakv2.netlify.app';

console.log('🔍 DIAGNOSTIC ESPACEMENT MOBILE - ZODIAK');
console.log('========================================\n');

async function testMobileSpacing() {
  try {
    // 1. Test de la page d'accueil
    console.log('1️⃣ Test page d\'accueil...');
    
    const homeResponse = await fetch(`${NETLIFY_URL}/`);
    console.log('📊 Status page d\'accueil:', homeResponse.status);
    
    if (homeResponse.ok) {
      const homeHtml = await homeResponse.text();
      
      // Vérifier les problèmes d'espacement
      if (homeHtml.includes('pt-16 md:pt-24')) {
        console.log('✅ Espacement responsive détecté');
      } else {
        console.log('❌ Espacement responsive manquant');
      }
      
      if (homeHtml.includes('safe-area-inset-top')) {
        console.log('✅ Safe area top détecté');
      } else {
        console.log('❌ Safe area top manquant');
      }
    }

    // 2. Test de la page profil
    console.log('\n2️⃣ Test page profil...');
    
    const profileResponse = await fetch(`${NETLIFY_URL}/profile`);
    console.log('📊 Status page profil:', profileResponse.status);
    
    if (profileResponse.ok) {
      const profileHtml = await profileResponse.text();
      
      // Vérifier PageLayout
      if (profileHtml.includes('page-container')) {
        console.log('✅ PageLayout détecté');
      } else {
        console.log('❌ PageLayout manquant');
      }
      
      if (profileHtml.includes('page-content')) {
        console.log('✅ Page content détecté');
      } else {
        console.log('❌ Page content manquant');
      }
      
      if (profileHtml.includes('py-8')) {
        console.log('✅ Padding vertical détecté');
      } else {
        console.log('❌ Padding vertical manquant');
      }
    }

    // 3. Test de la page natal
    console.log('\n3️⃣ Test page natal...');
    
    const natalResponse = await fetch(`${NETLIFY_URL}/natal`);
    console.log('📊 Status page natal:', natalResponse.status);
    
    if (natalResponse.ok) {
      const natalHtml = await natalResponse.text();
      
      if (natalHtml.includes('page-header')) {
        console.log('✅ Page header détecté');
      } else {
        console.log('❌ Page header manquant');
      }
    }

    // 4. Test de la page guidance
    console.log('\n4️⃣ Test page guidance...');
    
    const guidanceResponse = await fetch(`${NETLIFY_URL}/guidance`);
    console.log('📊 Status page guidance:', guidanceResponse.status);
    
    if (guidanceResponse.ok) {
      const guidanceHtml = await guidanceResponse.text();
      
      if (guidanceHtml.includes('space-y-4 md:space-y-6')) {
        console.log('✅ Espacement guidance responsive détecté');
      } else {
        console.log('❌ Espacement guidance responsive manquant');
      }
    }

  } catch (error) {
    console.error('❌ ERREUR lors du test:', error.message);
  }
}

async function analyzeSpacingIssues() {
  console.log('\n5️⃣ Analyse des problèmes d\'espacement...');
  
  console.log('🔍 PROBLÈMES IDENTIFIÉS:');
  console.log('1. PageLayout utilise py-8 par défaut (trop d\'espace sur mobile)');
  console.log('2. Pas de gestion des safe areas sur mobile');
  console.log('3. Pas de padding top adaptatif pour mobile');
  console.log('4. BottomNavBar peut créer des conflits d\'espacement');
  
  console.log('\n💡 SOLUTIONS PROPOSÉES:');
  console.log('1. Ajouter safe-area-inset-top au PageLayout');
  console.log('2. Réduire le padding top sur mobile');
  console.log('3. Optimiser l\'espacement pour les appareils avec notch');
  console.log('4. Ajuster le padding bottom pour la BottomNavBar');
}

async function runSpacingTests() {
  await testMobileSpacing();
  await analyzeSpacingIssues();
  
  console.log('\n🎯 RÉSUMÉ DES PROBLÈMES D\'ESPACEMENT');
  console.log('=====================================');
  console.log('❌ Espace vide en haut sur mobile');
  console.log('❌ Pas de gestion des safe areas');
  console.log('❌ Padding non adaptatif');
  console.log('❌ Conflits avec BottomNavBar');
  
  console.log('\n🚀 CORRECTIONS NÉCESSAIRES:');
  console.log('1. Modifier PageLayout pour mobile');
  console.log('2. Ajouter safe-area-inset-top');
  console.log('3. Optimiser les paddings');
  console.log('4. Tester sur appareils réels');
}

runSpacingTests().catch(console.error);
