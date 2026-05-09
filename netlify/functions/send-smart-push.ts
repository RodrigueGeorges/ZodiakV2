import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import { sendPush } from './_pushUtils';

/**
 * Cron : envoie une notification web-push contextuelle quand un moment
 * astrologique notable approche (Nouvelle Lune / Pleine Lune / quartier).
 *
 * Différent de `send-daily-push` qui pousse tous les jours à l'heure
 * favorite : ici on déclenche uniquement quand le ciel le mérite,
 * façon Co-Star.
 *
 * Idéalement appelé par un cron Netlify Scheduled Functions toutes les
 * heures. Le helper `nextSmartPushMoment` (côté client) sert aussi à
 * détecter les moments — la logique est dupliquée ici pour rester
 * autonome côté serverless (pas de dépendance au bundle front).
 *
 * Branchement cron Netlify (netlify.toml) :
 *   [[scheduled.functions]]
 *     name     = "send-smart-push"
 *     schedule = "@hourly"
 */

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const SYNODIC_MONTH = 29.530588853;
const REFERENCE_JD = 2451550.26; // Nouvelle lune réf 2000-01-06 18:14 UTC

function toJulian(d: Date) {
  return d.getTime() / 86400000 + 2440587.5;
}

function moonAge(date: Date): number {
  const jd = toJulian(date);
  return ((jd - REFERENCE_JD) % SYNODIC_MONTH + SYNODIC_MONTH) % SYNODIC_MONTH;
}

type Kind = 'new_moon' | 'full_moon' | 'quarter_moon';

function detectKind(date: Date): Kind | null {
  const age = moonAge(date);
  // Tolérance ±0.5 jour pour les phases (≈ ±12h)
  if (age < 0.5 || age > SYNODIC_MONTH - 0.5) return 'new_moon';
  if (Math.abs(age - SYNODIC_MONTH / 2) < 0.5) return 'full_moon';
  if (
    Math.abs(age - SYNODIC_MONTH / 4) < 0.5 ||
    Math.abs(age - (3 * SYNODIC_MONTH) / 4) < 0.5
  )
    return 'quarter_moon';
  return null;
}

const COPY: Record<Kind, { title: string; body: string }> = {
  new_moon: {
    title: 'Nouvelle Lune ✦',
    body: 'Le bon moment pour planter une intention. Que veux-tu vraiment lancer ?',
  },
  full_moon: {
    title: 'Pleine Lune ✦',
    body: "Une vague d'émotion en vue. Laisse remonter ce qui demande à être vu.",
  },
  quarter_moon: {
    title: 'La Lune en quartier',
    body: 'Un point de friction utile. Ajuste plutôt que pousser.',
  },
};

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

interface ProfileRow {
  id: string;
  timezone: string | null;
  daily_guidance_enabled: boolean | null;
}

interface PushSub {
  user_id: string;
  endpoint: string;
  keys_p256dh: string;
  keys_auth: string;
}

export const handler: Handler = async () => {
  const now = new Date();
  const kind = detectKind(now);
  if (!kind) {
    return {
      statusCode: 200,
      body: JSON.stringify({ skipped: true, reason: 'no notable moment' }),
    };
  }

  const slug = `${kind}_${now.toISOString().slice(0, 10)}`;
  const copy = COPY[kind];

  // Récupère les abonnés push (et la timezone via JOIN sur profiles)
  const { data: subs, error: subsErr } = await supabase
    .from('push_subscriptions')
    .select('user_id, endpoint, keys_p256dh, keys_auth');
  if (subsErr) {
    console.error('[smart-push] subs error', subsErr);
    return { statusCode: 500, body: JSON.stringify({ error: subsErr.message }) };
  }

  const userIds = Array.from(new Set((subs as PushSub[] | null)?.map((s) => s.user_id) ?? []));
  if (userIds.length === 0) {
    return { statusCode: 200, body: JSON.stringify({ sent: 0 }) };
  }

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, timezone, daily_guidance_enabled')
    .in('id', userIds);
  const profileMap = new Map<string, ProfileRow>();
  for (const p of (profiles as ProfileRow[] | null) ?? []) profileMap.set(p.id, p);

  // Track des envois déjà faits aujourd'hui via une table simple
  // (à créer si pas encore là). Si la table n'existe pas, on continue
  // sans dédup et on gère côté front avec localStorage.
  const { data: alreadySent } = await supabase
    .from('smart_push_log')
    .select('user_id')
    .eq('slug', slug);
  const sentSet = new Set(((alreadySent as { user_id: string }[] | null) ?? []).map((r) => r.user_id));

  let sent = 0;
  let skipped = 0;
  let purged = 0;

  for (const sub of (subs as PushSub[] | null) ?? []) {
    const prof = profileMap.get(sub.user_id);
    if (!prof || prof.daily_guidance_enabled === false) {
      skipped++;
      continue;
    }
    if (sentSet.has(sub.user_id)) {
      skipped++;
      continue;
    }
    const localHour = getHourInTz(prof.timezone || 'Europe/Paris');
    if (localHour < 8 || localHour >= 22) {
      skipped++;
      continue;
    }

    try {
      await sendPush(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.keys_p256dh, auth: sub.keys_auth },
        },
        {
          title: copy.title,
          body: copy.body,
          url: '/guidance',
          tag: slug,
        },
      );
      sent++;
      // Log de l'envoi pour dédup (best-effort, ignore les erreurs)
      try {
        await supabase
          .from('smart_push_log')
          .insert({ user_id: sub.user_id, slug, sent_at: new Date().toISOString() });
      } catch {
        /* table peut ne pas exister */
      }
    } catch (e: unknown) {
      const code = (e as { statusCode?: number })?.statusCode ?? 0;
      if (code === 404 || code === 410) {
        await supabase
          .from('push_subscriptions')
          .delete()
          .eq('endpoint', sub.endpoint);
        purged++;
      }
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ kind, slug, sent, skipped, purged }),
  };
};
