import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import { sendSms } from './_guidanceUtils';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
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
    if (!profile.phone) continue;

    // Récupérer la guidance du jour
    const { data: guidance } = await supabase
      .from('daily_guidance')
      .select('*')
      .eq('user_id', profile.id)
      .eq('date', today)
      .maybeSingle();

    if (!guidance) {
      console.warn(`❌ Pas de guidance à envoyer pour ${profile.id}`);
      continue;
    }

    // Envoyer le SMS
    try {
      await sendSms(profile.phone, guidance, profile.name, profile.id);
      console.log(`✅ SMS envoyé à ${profile.id}`);
    } catch (e) {
      console.error(`❌ Erreur envoi SMS pour ${profile.id}:`, e);
    }
  }

  return { statusCode: 200, body: 'Envoi SMS terminé.' };
};

export { handler }; 