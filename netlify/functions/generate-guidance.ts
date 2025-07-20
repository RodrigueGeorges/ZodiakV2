import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import { calculateDailyTransits, generateGuidanceWithOpenAI } from './_guidanceUtils';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BATCH_SIZE = 100;

const handler: Handler = async () => {
  const today = new Date().toISOString().slice(0, 10);
  let offset = 0;
  let totalProcessed = 0;
  let totalGenerated = 0;
  let totalSkipped = 0;
  let totalErrors = 0;
  console.log('🚀 Démarrage de la génération de guidance par lots...');
  while (true) {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('daily_guidance_sms_enabled', true)
      .in('subscription_status', ['active', 'trial'])
      .range(offset, offset + BATCH_SIZE - 1);
    if (error) {
      console.error('❌ Erreur récupération profils:', error.message);
      break;
    }
    if (!profiles || profiles.length === 0) break;
    for (const profile of profiles) {
      totalProcessed++;
      try {
        if (!profile.phone) {
          console.log(`⏭️ Profil ${profile.id} skippé: pas de téléphone.`);
          totalSkipped++;
          continue;
        }
        if (!profile.natal_chart) {
          console.log(`⏭️ Profil ${profile.id} skippé: pas de natal_chart.`);
          totalSkipped++;
          continue;
        }
        // Vérifier si la guidance existe déjà
        const { data: existing } = await supabase
          .from('daily_guidance')
          .select('id')
          .eq('user_id', profile.id)
          .eq('date', today)
          .maybeSingle();
        if (existing) {
          console.log(`⏭️ Profil ${profile.id} skippé: guidance déjà existante pour ${today}.`);
          totalSkipped++;
          continue;
        }
        // Générer la guidance
        try {
          console.log(`🚀 Génération guidance pour ${profile.id} (${profile.name})...`);
          const transits = await calculateDailyTransits(today);
          const guidance = await generateGuidanceWithOpenAI(profile.natal_chart, transits, today);
          const { error: upsertError } = await supabase.from('daily_guidance').upsert({
            user_id: profile.id,
            date: today,
            summary: guidance.summary,
            love: guidance.love,
            work: guidance.work,
            energy: guidance.energy,
            created_at: new Date().toISOString()
          });
          if (upsertError) {
            console.error(`❌ Erreur upsert guidance pour ${profile.id}:`, upsertError.message);
            totalErrors++;
          } else {
            console.log(`✅ Guidance générée et enregistrée pour ${profile.id}`);
            totalGenerated++;
          }
        } catch (e) {
          console.error(`❌ Erreur génération guidance pour ${profile.id}:`, e);
          totalErrors++;
        }
      } catch (e) {
        console.error(`❌ Erreur inattendue pour ${profile.id}:`, e);
        totalErrors++;
      }
    }
    offset += BATCH_SIZE;
  }
  console.log(`🎯 Génération terminée. Profils traités: ${totalProcessed}, générés: ${totalGenerated}, skippés: ${totalSkipped}, erreurs: ${totalErrors}`);
  return { statusCode: 200, body: 'Génération terminée.' };
};

export { handler }; 