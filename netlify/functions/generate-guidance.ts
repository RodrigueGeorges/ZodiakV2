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

  if (error) return { statusCode: 500, body: error.message };

  for (const profile of profiles || []) {
    if (!profile.phone || !profile.natal_chart) continue;

    // Vérifier si la guidance existe déjà
    const { data: existing } = await supabase
      .from('daily_guidance')
      .select('id')
      .eq('user_id', profile.id)
      .eq('date', today)
      .maybeSingle();

    if (existing) continue;

    // Générer la guidance
    try {
      const transits = await calculateDailyTransits(today);
      const guidance = await generateGuidanceWithOpenAI(profile.natal_chart, transits, today);

      await supabase.from('daily_guidance').upsert({
        user_id: profile.id,
        date: today,
        summary: guidance.summary,
        love: guidance.love,
        work: guidance.work,
        energy: guidance.energy,
        created_at: new Date().toISOString()
      });
      console.log(`✅ Guidance générée pour ${profile.id}`);
    } catch (e) {
      console.error(`❌ Erreur génération guidance pour ${profile.id}:`, e);
    }
  }

  return { statusCode: 200, body: 'Génération terminée.' };
};

export { handler }; 