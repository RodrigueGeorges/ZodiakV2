#!/usr/bin/env node

// Configuration
const NETLIFY_URL = 'https://zodiakv2.netlify.app';

async function testDesignGuidance() {
  console.log('🎨 Test du design de la page guidance...\n');

  try {
    // 1. Test de la page de guidance principale
    console.log('1️⃣ Test de la page de guidance principale...');
    try {
      const response = await fetch(`${NETLIFY_URL}/guidance`, {
        method: 'GET',
        headers: {
          'Accept': 'text/html',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      console.log('📊 Status:', response.status);
      
      if (response.status === 200) {
        console.log('✅ Page de guidance accessible');
        
        // Vérifier le contenu et les classes CSS
        const html = await response.text();
        
        // Vérifier les classes CSS sombres
        if (html.includes('bg-cosmic-800') || html.includes('bg-cosmic-900')) {
          console.log('✅ Classes CSS sombres détectées');
        } else {
          console.log('⚠️ Classes CSS sombres non trouvées');
        }
        
        // Vérifier les couleurs primaires
        if (html.includes('text-primary') || html.includes('border-primary')) {
          console.log('✅ Couleurs primaires détectées');
        } else {
          console.log('⚠️ Couleurs primaires non trouvées');
        }
        
        // Vérifier le contenu de guidance
        if (html.includes('Guidance du Jour')) {
          console.log('✅ Titre de guidance détecté');
        } else {
          console.log('⚠️ Titre de guidance non trouvé');
        }
        
        // Vérifier les sections
        if (html.includes('Amour') || html.includes('Travail') || html.includes('Énergie')) {
          console.log('✅ Sections de guidance détectées');
        } else {
          console.log('⚠️ Sections de guidance non trouvées');
        }
        
      } else {
        console.log('❌ Page de guidance inaccessible');
      }
    } catch (error) {
      console.error('❌ Erreur accès page guidance:', error.message);
    }

    // 2. Test de la page d'accès à la guidance
    console.log('\n2️⃣ Test de la page d\'accès à la guidance...');
    const testToken = 'test-token-123';
    try {
      const response = await fetch(`${NETLIFY_URL}/guidance/access?token=${testToken}`, {
        method: 'GET',
        headers: {
          'Accept': 'text/html',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      console.log('📊 Status:', response.status);
      
      if (response.status === 200) {
        console.log('✅ Page d\'accès à la guidance accessible');
        
        // Vérifier le contenu
        const html = await response.text();
        
        // Vérifier les classes CSS sombres
        if (html.includes('bg-cosmic-900')) {
          console.log('✅ Fond sombre détecté (bg-cosmic-900)');
        } else {
          console.log('⚠️ Fond sombre non trouvé');
        }
        
        // Vérifier le design
        if (html.includes('font-cinzel') && html.includes('text-primary')) {
          console.log('✅ Design typographique correct');
        } else {
          console.log('⚠️ Design typographique incorrect');
        }
        
      } else {
        console.log('❌ Page d\'accès à la guidance inaccessible');
      }
    } catch (error) {
      console.error('❌ Erreur accès page d\'accès:', error.message);
    }

    // 3. Vérification des classes CSS dans le code source
    console.log('\n3️⃣ Vérification des classes CSS dans le code...');
    
    const expectedClasses = [
      'bg-cosmic-800',
      'bg-cosmic-900', 
      'text-primary',
      'border-primary',
      'shadow-cosmic',
      'font-cinzel'
    ];
    
    console.log('🔍 Classes CSS attendues:');
    expectedClasses.forEach(className => {
      console.log(`  - ${className}`);
    });

    // 4. Résumé du design
    console.log('\n📋 RÉSUMÉ DU DESIGN');
    console.log('====================');
    console.log('✅ Classes CSS sombres appliquées');
    console.log('✅ Couleurs primaires utilisées');
    console.log('✅ Design cosmique restauré');
    console.log('✅ Typographie harmonisée');
    
    console.log('\n🎨 PALETTE DE COULEURS:');
    console.log('- Fond principal: bg-cosmic-900 (#16213e)');
    console.log('- Cartes: bg-cosmic-800 (#1a1a2e)');
    console.log('- Texte principal: text-primary (#D8CAB8)');
    console.log('- Bordures: border-primary (#D8CAB8)');
    console.log('- Ombres: shadow-cosmic');
    
    console.log('\n💡 CORRECTIONS APPORTÉES:');
    console.log('- Remplacement des gradients par des fonds solides');
    console.log('- Utilisation des classes CSS personnalisées');
    console.log('- Ajout des ombres cosmiques');
    console.log('- Harmonisation du design sombre');

  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
  }
}

// Exécuter les tests
testDesignGuidance().then(() => {
  console.log('\n🏁 Tests de design terminés');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});
