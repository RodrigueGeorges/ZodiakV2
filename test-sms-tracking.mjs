// Script de test pour le système de tracking SMS
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testSMSTracking() {
  console.log('🧪 Test du système de tracking SMS...\n');

  try {
    // 1. Vérifier que la table sms_tracking existe
    console.log('1. Vérification de la table sms_tracking...');
    const { data: tableCheck, error: tableError } = await supabase
      .from('sms_tracking')
      .select('count')
      .limit(1);

    if (tableError) {
      console.error('❌ Erreur lors de la vérification de la table:', tableError);
      return;
    }
    console.log('✅ Table sms_tracking accessible\n');

    // 2. Créer une entrée de test
    console.log('2. Création d\'une entrée de test...');
    const testData = {
      user_id: '00000000-0000-0000-0000-000000000000', // UUID de test
      short_code: 'TEST123',
      token: '00000000-0000-0000-0000-000000000000',
      date: new Date().toISOString().split('T')[0],
      sent_at: new Date().toISOString()
    };

    const { data: insertData, error: insertError } = await supabase
      .from('sms_tracking')
      .insert(testData)
      .select();

    if (insertError) {
      console.error('❌ Erreur lors de l\'insertion:', insertError);
      return;
    }
    console.log('✅ Entrée de test créée:', insertData[0].id, '\n');

    // 3. Simuler un tracking d'ouverture
    console.log('3. Simulation d\'un tracking d\'ouverture...');
    const { data: openData, error: openError } = await supabase
      .from('sms_tracking')
      .update({
        opened_at: new Date().toISOString(),
        user_agent: 'Test Browser/1.0',
        ip_address: '127.0.0.1'
      })
      .eq('short_code', 'TEST123')
      .select();

    if (openError) {
      console.error('❌ Erreur lors du tracking d\'ouverture:', openError);
      return;
    }
    console.log('✅ Tracking d\'ouverture enregistré\n');

    // 4. Simuler un tracking de clic
    console.log('4. Simulation d\'un tracking de clic...');
    const { data: clickData, error: clickError } = await supabase
      .from('sms_tracking')
      .update({
        clicked_at: new Date().toISOString()
      })
      .eq('short_code', 'TEST123')
      .select();

    if (clickError) {
      console.error('❌ Erreur lors du tracking de clic:', clickError);
      return;
    }
    console.log('✅ Tracking de clic enregistré\n');

    // 5. Vérifier les statistiques
    console.log('5. Vérification des statistiques...');
    const { data: stats, error: statsError } = await supabase
      .from('sms_tracking')
      .select('*');

    if (statsError) {
      console.error('❌ Erreur lors de la récupération des stats:', statsError);
      return;
    }

    const totalSent = stats.length;
    const totalOpened = stats.filter(s => s.opened_at).length;
    const totalClicked = stats.filter(s => s.clicked_at).length;

    console.log('📊 Statistiques:');
    console.log(`   - Total envoyés: ${totalSent}`);
    console.log(`   - Total ouverts: ${totalOpened}`);
    console.log(`   - Total cliqués: ${totalClicked}`);
    console.log(`   - Taux d'ouverture: ${totalSent > 0 ? Math.round((totalOpened / totalSent) * 100) : 0}%`);
    console.log(`   - Taux de clic: ${totalSent > 0 ? Math.round((totalClicked / totalSent) * 100) : 0}%\n`);

    // 6. Nettoyer les données de test
    console.log('6. Nettoyage des données de test...');
    const { error: deleteError } = await supabase
      .from('sms_tracking')
      .delete()
      .eq('short_code', 'TEST123');

    if (deleteError) {
      console.error('❌ Erreur lors du nettoyage:', deleteError);
      return;
    }
    console.log('✅ Données de test supprimées\n');

    console.log('🎉 Test du système de tracking SMS terminé avec succès !');

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécuter le test si le script est appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  testSMSTracking();
}

export { testSMSTracking }; 