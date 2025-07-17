import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import { calculateDailyTransits, generateGuidanceWithOpenAI } from './_guidanceUtils';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

const handler: Handler = async () => {
  const today = new Date().toISOString().slice(0, 10);

  // 1. Récupérer les profils éligibles
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('daily_guidance_sms_enabled', true)
    .in('subscription_status', ['active', 'trial']);

  if (error) {
    console.error('❌ Erreur récupération profils:', error.message);
    return { statusCode: 500, body: error.message };
  }

  console.log(`📋 Profils éligibles trouvés: ${profiles?.length || 0}`);

  for (const profile of profiles || []) {
    if (!profile.phone) {
      console.log(`⏭️ Profil ${profile.id} skippé: pas de téléphone.`);
      continue;
    }
    if (!profile.natal_chart) {
      console.log(`⏭️ Profil ${profile.id} skippé: pas de natal_chart.`);
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
      } else {
        console.log(`✅ Guidance générée et enregistrée pour ${profile.id}`);
      }
    } catch (e) {
      console.error(`❌ Erreur génération guidance pour ${profile.id}:`, e);
    }
  }

  return { statusCode: 200, body: 'Génération terminée.' };
};

export { handler }; 