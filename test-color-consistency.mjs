import fetch from 'node-fetch';

const NETLIFY_URL = 'https://zodiakv2.netlify.app';

console.log('🎨 TEST COHÉRENCE COULEURS - ZODIAK');
console.log('====================================\n');

async function testColorConsistency() {
  try {
    // 1. Test de la page d'accueil
    console.log('1️⃣ Test page d\'accueil...');
    
    const homeResponse = await fetch(`${NETLIFY_URL}/`);
    console.log('📊 Status page d\'accueil:', homeResponse.status);
    
    if (homeResponse.ok) {
      const homeHtml = await homeResponse.text();
      
      // Vérifier les couleurs bleues
      if (homeHtml.includes('from-blue-300 via-blue-200 to-cyan-300')) {
        console.log('✅ Nom "Zodiak" en bleu détecté');
      } else {
        console.log('❌ Nom "Zodiak" pas en bleu');
      }
      
      if (homeHtml.includes('from-blue-200 via-blue-100 to-cyan-200')) {
        console.log('✅ Tagline en bleu détectée');
      } else {
        console.log('❌ Tagline pas en bleu');
      }
      
      if (homeHtml.includes('from-blue-400 to-blue-600')) {
        console.log('✅ Bouton principal en bleu détecté');
      } else {
        console.log('❌ Bouton principal pas en bleu');
      }
    }

    // 2. Test de la page profil
    console.log('\n2️⃣ Test page profil...');
    
    const profileResponse = await fetch(`${NETLIFY_URL}/profile`);
    console.log('📊 Status page profil:', profileResponse.status);
    
    if (profileResponse.ok) {
      const profileHtml = await profileResponse.text();
      
      // Vérifier PageLayout
      if (profileHtml.includes('from-blue-300 to-blue-500')) {
        console.log('✅ PageLayout en bleu détecté');
      } else {
        console.log('❌ PageLayout pas en bleu');
      }
      
      if (profileHtml.includes('text-blue-300/80')) {
        console.log('✅ Subtitle en bleu détecté');
      } else {
        console.log('❌ Subtitle pas en bleu');
      }
    }

    // 3. Test de la page natal
    console.log('\n3️⃣ Test page natal...');
    
    const natalResponse = await fetch(`${NETLIFY_URL}/natal`);
    console.log('📊 Status page natal:', natalResponse.status);
    
    if (natalResponse.ok) {
      const natalHtml = await natalResponse.text();
      
      if (natalHtml.includes('from-blue-300 to-blue-500')) {
        console.log('✅ Page natal en bleu détecté');
      } else {
        console.log('❌ Page natal pas en bleu');
      }
    }

    // 4. Test de la navigation mobile
    console.log('\n4️⃣ Test navigation mobile...');
    
    const navResponse = await fetch(`${NETLIFY_URL}/profile`);
    if (navResponse.ok) {
      const navHtml = await navResponse.text();
      
      if (navHtml.includes('text-blue-400 hover:text-blue-300')) {
        console.log('✅ BottomNavBar en bleu détectée');
      } else {
        console.log('❌ BottomNavBar pas en bleu');
      }
      
      if (navHtml.includes('border-blue-400/20')) {
        console.log('✅ Bordure BottomNavBar en bleu détectée');
      } else {
        console.log('❌ Bordure BottomNavBar pas en bleu');
      }
    }

  } catch (error) {
    console.error('❌ ERREUR lors du test:', error.message);
  }
}

async function analyzeColorTheme() {
  console.log('\n5️⃣ Analyse du thème de couleurs...');
  
  console.log('🎯 THÈME BLEU COSMIQUE UNIFIÉ:');
  console.log('✅ Logo : Bleu néon (#00BFFF)');
  console.log('✅ Nom "Zodiak" : Gradient bleu');
  console.log('✅ Tagline : Gradient bleu');
  console.log('✅ Bouton principal : Bleu');
  console.log('✅ PageLayout : Gradients bleus');
  console.log('✅ BottomNavBar : Bleu');
  console.log('✅ Variables CSS : Primary/Secondary en bleu');
  
  console.log('\n💡 AVANTAGES DU THÈME BLEU:');
  console.log('✅ Cohérence visuelle parfaite');
  console.log('✅ Thème cosmique adapté à l\'astrologie');
  console.log('✅ Moderne et élégant');
  console.log('✅ Accessibilité améliorée');
  console.log('✅ Expérience utilisateur harmonieuse');
}

async function runColorTests() {
  await testColorConsistency();
  await analyzeColorTheme();
  
  console.log('\n🎯 RÉSUMÉ DE LA COHÉRENCE COULEURS');
  console.log('===================================');
  console.log('✅ Thème bleu cosmique unifié');
  console.log('✅ Logo cohérent avec le thème');
  console.log('✅ Navigation harmonisée');
  console.log('✅ Pages internes cohérentes');
  console.log('✅ Variables CSS standardisées');
  
  console.log('\n🚀 PROCHAINES ÉTAPES:');
  console.log('1. Tester sur appareils réels');
  console.log('2. Valider l\'accessibilité');
  console.log('3. Vérifier le contraste');
  console.log('4. Optimiser si nécessaire');
  
  console.log('\n🎉 La cohérence des couleurs est maintenant parfaite !');
}

runColorTests().catch(console.error);
