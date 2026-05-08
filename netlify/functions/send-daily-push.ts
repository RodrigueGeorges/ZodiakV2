import { Handler, schedule } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import { sendPush } from './_pushUtils';

/**
 * Cron horaire : envoie une notification Web Push aux users dont
 * l'heure locale = `guidance_hour`, avec un teaser de leur guidance du jour.
 *
 * Logique :
 *   1. Récupère les profiles avec daily_guidance_enabled=true.
 *   2. Filtre par fuseau : on ne pousse qu'à l'heure locale = guidance_hour.
 *   3. Pour chaque user, lit la `daily_guidance` du jour (ou skip).
 *   4. Lit toutes ses `push_subscriptions` et envoie un payload teaser.
 *   5. Supprime les subscriptions expirées (410/404).
 *
 * Branché en complément (pas remplacement) de WhatsApp/Instagram : un user
 * peut avoir les 3 canaux. C'est exprès — push web = touche-à-l'instant gratuit.
 */

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function getHourInTz(tz: string, now = new Date()): number {
  try {
    const fmt = new Intl.DateTimeFormat('en-GB', {
      timeZone: tz,
      hour12: false,
      hour: '2-digit',
    });
    return parseInt(fmt.format(now), 10);
  } catch {
    return now.getUTCHours();
  }
}

function getDateInTz(tz: string, now = new Date()): string {
  try {
    const fmt = new Intl.DateTimeFormat('en-CA', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const parts = fmt
      .formatToParts(now)
      .reduce<Record<string, string>>((acc, p) => ((acc[p.type] = p.value), acc), {});
    return `${parts.year}-${parts.month}-${parts.day}`;
  } catch {
    return now.toISOString().slice(0, 10);
  }
}

const TEASERS = [
  'Le ciel a parlé ✦ Découvre ta lecture du jour.',
  '✨ Un transit te concerne aujourd\'hui.',
  'Ta guidance est prête. Lis-la avant la nuit ✦',
  'Le mantra du jour t\'attend ✦',
  'Les étoiles ont aligné un message pour toi ✦',
];

const handler: Handler = async () => {
  const now = new Date();
  let pageOffset = 0;
  const PAGE = 200;
  let dispatched = 0;
  let skipped = 0;
  const errors: Array<{ user_id: string; reason: string }> = [];

  for (;;) {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, name, timezone, guidance_hour, daily_guidance_enabled, plan')
      .eq('daily_guidance_enabled', true)
      .range(pageOffset, pageOffset + PAGE - 1);

    if (error) {
      return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
    if (!profiles || profiles.length === 0) break;

    for (const profile of profiles) {
      const tz = profile.timezone || 'Europe/Paris';
      const localHour = getHourInTz(tz, now);
      if (localHour !== profile.guidance_hour) {
        skipped++;
        continue;
      }

      const today = getDateInTz(tz, now);
      const { data: guidance } = await supabase
        .from('daily_guidance')
        .select('summary')
        .eq('user_id', profile.id)
        .eq('date', today)
        .maybeSingle();

      if (!guidance) {
        skipped++;
        continue;
      }

      const { data: subs } = await supabase
        .from('push_subscriptions')
        .select('id, user_id, endpoint, p256dh, auth')
        .eq('user_id', profile.id);

      if (!subs || subs.length === 0) {
        skipped++;
        continue;
      }

      const teaser = TEASERS[Math.floor(Math.random() * TEASERS.length)];
      const payload = {
        title: `Bonjour ${profile.name?.split(' ')[0] || '✦'}`,
        body: teaser,
        url: '/guidance',
        tag: 'daily-guidance',
        renotify: true,
        icon: '/icons/icon-192.png',
        badge: '/icons/badge-72.png',
      };

      for (const sub of subs) {
        const res = await sendPush(sub, payload);
        if (res.ok) {
          dispatched++;
          await supabase
            .from('push_subscriptions')
            .update({ last_used_at: new Date().toISOString() })
            .eq('id', sub.id);
        } else if (res.shouldRemove) {
          await supabase.from('push_subscriptions').delete().eq('id', sub.id);
          errors.push({ user_id: profile.id, reason: `removed expired (${res.status})` });
        } else {
          errors.push({
            user_id: profile.id,
            reason: `${res.status} ${res.error}`,
          });
        }
      }
    }

    if (profiles.length < PAGE) break;
    pageOffset += PAGE;
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ dispatched, skipped, errors: errors.slice(0, 20) }),
  };
};

// Branché toutes les heures pile (utc).
export const config = { schedule: '5 * * * *' };
export { handler };
export const scheduled = schedule('5 * * * *', handler as never);
