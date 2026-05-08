import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import { calculateDailyTransits, generateGuidanceWithOpenAI } from './_guidanceUtils';

/**
 * Cron de génération de la guidance du jour (UNE seule fois / jour, scheduled
 * à 23h UTC dans `netlify.toml`).
 *
 * Ne fait JAMAIS d'envoi (séparation stricte des responsabilités). L'envoi
 * est piloté par le cron horaire `send-daily-guidance.ts` qui dispatch via
 * WhatsApp / Instagram selon l'heure locale du profil.
 *
 * Sources de vérité :
 *   - daily_guidance(user_id, date)  : 1 ligne / user / jour
 *   - daily_transits(date)           : cache mutualisé tous users
 *   - guidance_cache(cache_key)      : cache OpenAI par signature thème+transits
 *
 * Stratégie de date :
 *   - On génère pour la date "Europe/Paris" du moment (fuseau majoritaire).
 *   - Pour les users dans des fuseaux qui passent à J+1 avant Paris (Asie),
 *     on génère leur guidance "demain Paris" qui sera leur "aujourd'hui local"
 *     au moment du dispatch.
 *   - À l'avenir, si on a beaucoup de users hors Europe, on tournera ce cron
 *     plus souvent (ex: toutes les 6h) avec une logique multi-jours.
 */

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BATCH_SIZE = 100;
const TIMEZONE = 'Europe/Paris';

function getDateInTz(tz: string, now: Date = new Date()): string {
  try {
    const fmt = new Intl.DateTimeFormat('en-CA', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const parts = fmt.formatToParts(now).reduce<Record<string, string>>((acc, p) => {
      acc[p.type] = p.value;
      return acc;
    }, {});
    return `${parts.year}-${parts.month}-${parts.day}`;
  } catch {
    return now.toISOString().slice(0, 10);
  }
}

const handler: Handler = async () => {
  const today = getDateInTz(TIMEZONE);
  let offset = 0;
  let totalProcessed = 0;
  let totalGenerated = 0;
  let totalSkipped = 0;
  let totalErrors = 0;

  console.log('[generate-guidance] start', { today });

  // Pré-génération des transits du jour (mutualisée, 1 seule fois)
  let transitsForToday: unknown = null;
  try {
    transitsForToday = await calculateDailyTransits(today);
  } catch (e) {
    console.error('[generate-guidance] transits failed, will retry per-user', (e as Error).message);
  }

  while (true) {
    // Sélection des profils éligibles
    //   - Soit nouveau modèle Meta (preferred_channel + canal configuré)
    //   - Soit legacy (téléphone) — on garde transitoirement pour ne pas casser
    //     les users existants pendant la phase de migration.
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, name, natal_chart, preferred_channel, whatsapp_wa_id, instagram_igsid, daily_guidance_enabled, subscription_status')
      .eq('daily_guidance_enabled', true)
      .in('subscription_status', ['active', 'trial'])
      .range(offset, offset + BATCH_SIZE - 1);

    if (error) {
      console.error('[generate-guidance] profiles select failed', error.message);
      break;
    }
    if (!profiles || profiles.length === 0) break;

    for (const profile of profiles) {
      totalProcessed++;
      try {
        if (!profile.natal_chart) {
          totalSkipped++;
          continue;
        }

        // Pas la peine de générer si aucun canal n'est configuré
        const hasChannel =
          (profile.preferred_channel === 'whatsapp' && profile.whatsapp_wa_id) ||
          (profile.preferred_channel === 'instagram' && profile.instagram_igsid);
        if (!hasChannel) {
          totalSkipped++;
          continue;
        }

        const { data: existing } = await supabase
          .from('daily_guidance')
          .select('id')
          .eq('user_id', profile.id)
          .eq('date', today)
          .maybeSingle();
        if (existing) {
          totalSkipped++;
          continue;
        }

        const transits = transitsForToday ?? (await calculateDailyTransits(today));
        const guidance = await generateGuidanceWithOpenAI(profile.natal_chart, transits, today);

        const safeGuidance = {
          summary: guidance.summary || '',
          love:
            typeof guidance.love === 'object' && guidance.love && 'text' in guidance.love
              ? guidance.love
              : { text: typeof guidance.love === 'string' ? guidance.love : '', score: 75 },
          work:
            typeof guidance.work === 'object' && guidance.work && 'text' in guidance.work
              ? guidance.work
              : { text: typeof guidance.work === 'string' ? guidance.work : '', score: 75 },
          energy:
            typeof guidance.energy === 'object' && guidance.energy && 'text' in guidance.energy
              ? guidance.energy
              : { text: typeof guidance.energy === 'string' ? guidance.energy : '', score: 75 },
          mantra: guidance.mantra || '',
        };

        const { error: upsertError } = await supabase.from('daily_guidance').upsert({
          user_id: profile.id,
          date: today,
          summary: safeGuidance.summary,
          love: safeGuidance.love,
          work: safeGuidance.work,
          energy: safeGuidance.energy,
          created_at: new Date().toISOString(),
        });
        if (upsertError) {
          console.error('[generate-guidance] upsert failed', { user: profile.id, err: upsertError.message });
          totalErrors++;
        } else {
          totalGenerated++;
        }
      } catch (e) {
        console.error('[generate-guidance] CRITICAL', { user: profile.id, err: (e as Error).message });
        totalErrors++;
      }
    }
    offset += BATCH_SIZE;
  }

  console.log('[generate-guidance] done', {
    today,
    totalProcessed,
    totalGenerated,
    totalSkipped,
    totalErrors,
  });
  return {
    statusCode: 200,
    body: JSON.stringify({ today, totalProcessed, totalGenerated, totalSkipped, totalErrors }),
  };
};

export { handler };
