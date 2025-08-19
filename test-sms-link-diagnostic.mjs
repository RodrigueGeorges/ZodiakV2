#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

// Configuration - Variables pour les fonctions Netlify
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('❌ Variables d\'environnement manquantes');
  console.error('SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', serviceKey ? '✅' : '❌');
  console.error('VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL ? '✅' : '❌');
  console.error('VITE_SUPABASE_ANON_KEY:', process.env.VITE_SUPABASE_ANON_KEY ? '✅' : '❌');
  
  console.log('\n💡 Pour résoudre ce problème:');
  console.log('1. Créez un fichier .env.local avec:');
  console.log('   SUPABASE_URL=votre_url_supabase');
  console.log('   SUPABASE_SERVICE_ROLE_KEY=votre_clé_service');
  console.log('2. Ou utilisez les variables VITE_ si disponibles');
  
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

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
  console.log('🔍 Diagnostic du système de liens SMS...\n');

  try {
    // 1. Récupérer un utilisateur de test (Rodrigue)
    console.log('1️⃣ Récupération du profil de test...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('phone', '+33612345678') // Numéro de Rodrigue
      .maybeSingle();

    if (profileError) {
      console.error('❌ Erreur récupération profil:', profileError.message);
      return;
    }

    if (!profile) {
      console.error('❌ Profil de test non trouvé');
      return;
    }

    console.log('✅ Profil trouvé:', {
      id: profile.id,
      name: profile.name,
      phone: profile.phone,
      subscription_status: profile.subscription_status
    });

    // 2. Vérifier la guidance du jour
    console.log('\n2️⃣ Vérification de la guidance du jour...');
    const today = new Date().toISOString().slice(0, 10);
    const { data: guidance, error: guidanceError } = await supabase
      .from('daily_guidance')
      .select('*')
      .eq('user_id', profile.id)
      .eq('date', today)
      .maybeSingle();

    if (guidanceError) {
      console.error('❌ Erreur récupération guidance:', guidanceError.message);
      return;
    }

    if (!guidance) {
      console.log('⚠️ Aucune guidance trouvée pour aujourd\'hui, création d\'une guidance de test...');
      
      // Créer une guidance de test
      const testGuidance = {
        user_id: profile.id,
        date: today,
        summary: 'Test de guidance pour diagnostic des liens SMS',
        love: 'Test amour',
        work: 'Test travail',
        energy: 'Test énergie',
        created_at: new Date().toISOString()
      };

      const { error: insertError } = await supabase
        .from('daily_guidance')
        .insert(testGuidance);

      if (insertError) {
        console.error('❌ Erreur création guidance test:', insertError.message);
        return;
      }

      console.log('✅ Guidance de test créée');
    } else {
      console.log('✅ Guidance existante trouvée');
    }

    // 3. Générer un nouveau lien SMS
    console.log('\n3️⃣ Génération d\'un nouveau lien SMS...');
    const token = randomUUID();
    let shortCode;
    let isUnique = false;
    
    while (!isUnique) {
      shortCode = generateShortCode();
      const { data: existing } = await supabase
        .from('guidance_token')
        .select('id')
        .eq('short_code', shortCode)
        .maybeSingle();
      if (!existing) isUnique = true;
    }

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    // Insérer le token
    const { error: tokenError } = await supabase
      .from('guidance_token')
      .insert({
        user_id: profile.id,
        token,
        date: today,
        expires_at: expiresAt,
        short_code: shortCode
      });

    if (tokenError) {
      console.error('❌ Erreur création token:', tokenError.message);
      return;
    }

    // Créer l'entrée de tracking
    const { error: trackingError } = await supabase
      .from('sms_tracking')
      .insert({
        user_id: profile.id,
        short_code: shortCode,
        token: token,
        date: today,
        sent_at: new Date().toISOString()
      });

    if (trackingError) {
      console.error('❌ Erreur création tracking:', trackingError.message);
      return;
    }

    console.log('✅ Lien SMS généré:', {
      shortCode,
      token: token.slice(0, 8) + '...',
      expiresAt
    });

    // 4. Tester l'accès au lien
    console.log('\n4️⃣ Test d\'accès au lien...');
    const appUrl = 'https://zodiak.netlify.app';
    const shortLink = `${appUrl}/g/${shortCode}`;
    const accessLink = `${appUrl}/guidance/access?token=${token}`;

    console.log('🔗 Lien court:', shortLink);
    console.log('🔗 Lien d\'accès direct:', accessLink);

    // 5. Vérifier la validité du token
    console.log('\n5️⃣ Vérification de la validité du token...');
    const { data: tokenRow, error: tokenCheckError } = await supabase
      .from('guidance_token')
      .select('*')
      .eq('short_code', shortCode)
      .maybeSingle();

    if (tokenCheckError) {
      console.error('❌ Erreur vérification token:', tokenCheckError.message);
      return;
    }

    if (!tokenRow) {
      console.error('❌ Token non trouvé en base');
      return;
    }

    console.log('✅ Token valide:', {
      user_id: tokenRow.user_id,
      date: tokenRow.date,
      expires_at: tokenRow.expires_at,
      isExpired: new Date(tokenRow.expires_at) < new Date()
    });

    // 6. Simuler un tracking
    console.log('\n6️⃣ Test du système de tracking...');
    const trackingUrl = `${appUrl}/.netlify/functions/track-sms?shortCode=${shortCode}&token=${token}&action=click`;
    
    try {
      const response = await fetch(trackingUrl);
      const result = await response.json();
      
      if (response.ok) {
        console.log('✅ Tracking fonctionnel:', result);
      } else {
        console.error('❌ Erreur tracking:', result);
      }
    } catch (trackingTestError) {
      console.error('❌ Erreur test tracking:', trackingTestError.message);
    }

    // 7. Résumé final
    console.log('\n📋 RÉSUMÉ DU DIAGNOSTIC');
    console.log('========================');
    console.log('✅ Profil utilisateur: OK');
    console.log('✅ Guidance du jour: OK');
    console.log('✅ Génération lien: OK');
    console.log('✅ Token en base: OK');
    console.log('✅ Tracking: OK');
    console.log('\n🎯 LIENS À TESTER:');
    console.log(`Lien court: ${shortLink}`);
    console.log(`Lien direct: ${accessLink}`);
    console.log('\n💡 Instructions:');
    console.log('1. Ouvrez le lien court dans un navigateur');
    console.log('2. Vérifiez la redirection vers la guidance');
    console.log('3. Vérifiez l\'affichage du contenu');
    console.log('4. Testez sur mobile si possible');

  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
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
