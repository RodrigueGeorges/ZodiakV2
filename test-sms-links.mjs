// Test script pour vérifier la génération des liens SMS
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://your-project.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key'
);

// Fonction utilitaire pour générer un code court
function generateShortCode(length = 6) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Fonction utilitaire pour générer un UUID
function randomUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

async function testSmsLinkGeneration() {
  console.log('🧪 Test de génération de liens SMS...');
  
  try {
    // 1. Récupérer un utilisateur de test
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, name, phone')
      .eq('daily_guidance_sms_enabled', true)
      .limit(1);
    
    if (error || !profiles || profiles.length === 0) {
      console.log('❌ Aucun utilisateur trouvé pour le test');
      return;
    }
    
    const testUser = profiles[0];
    console.log(`✅ Utilisateur de test trouvé: ${testUser.name} (${testUser.id})`);
    
    // 2. Générer un lien court
    const shortCode = generateShortCode();
    const token = randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const today = new Date().toISOString().slice(0, 10);
    
    console.log(`📝 Génération du lien court: ${shortCode}`);
    
    // 3. Sauvegarder le token
    const { error: tokenError } = await supabase
      .from('guidance_token')
      .upsert({
        user_id: testUser.id,
        token,
        date: today,
        expires_at: expiresAt,
        short_code: shortCode
      });
    
    if (tokenError) {
      console.log('❌ Erreur lors de la sauvegarde du token:', tokenError);
      return;
    }
    
    // 4. Créer l'entrée de tracking
    const { error: trackingError } = await supabase
      .from('sms_tracking')
      .insert({
        user_id: testUser.id,
        short_code: shortCode,
        token: token,
        date: today,
        sent_at: new Date().toISOString()
      });
    
    if (trackingError) {
      console.log('❌ Erreur lors de la création du tracking:', trackingError);
      return;
    }
    
    // 5. Générer le lien final
    const appUrl = process.env.URL || 'https://zodiak.netlify.app';
    const shortLink = `${appUrl}/g/${shortCode}`;
    
    console.log('✅ Lien généré avec succès!');
    console.log(`🔗 Lien court: ${shortLink}`);
    console.log(`🔑 Token: ${token}`);
    console.log(`📅 Expire le: ${expiresAt}`);
    
    // 6. Simuler le contenu du SMS
    const smsContent = `✨ Bonjour ${testUser.name?.split(' ')[0] || 'cher utilisateur'} !\n\nDécouvre ta guidance du jour ! 🌟\nLes astres ont un message spécial pour toi 👇\n${shortLink}\n(Valable 24h)`;
    
    console.log('\n📱 Contenu du SMS:');
    console.log('─'.repeat(50));
    console.log(smsContent);
    console.log('─'.repeat(50));
    
    // 7. Vérifier que le lien est accessible
    console.log('\n🔍 Vérification de l\'accessibilité du lien...');
    try {
      const response = await fetch(shortLink);
      if (response.ok) {
        console.log('✅ Le lien est accessible');
      } else {
        console.log(`⚠️ Le lien retourne un statut ${response.status}`);
      }
    } catch (fetchError) {
      console.log('⚠️ Erreur lors de la vérification du lien:', fetchError.message);
    }
    
  } catch (error) {
    console.log('❌ Erreur lors du test:', error);
  }
}

// Exécuter le test
testSmsLinkGeneration(); 