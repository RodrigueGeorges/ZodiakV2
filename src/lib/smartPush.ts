/**
 * smartPush.ts — détection des transits clés pour push contextuel.
 *
 * On expose un helper qui calcule, pour les prochaines 24h, les
 * "moments astrologiques notables" et propose des messages courts
 * façon Co-Star ("La Lune entre dans ton signe à 14h32").
 *
 * Côté serveur : un cron Netlify (à brancher) appellera ce module et
 * enverra les pushs via `web-push` aux abonnés concernés. Pour
 * l'instant, on expose la fonction front pour que la page Guidance
 * puisse afficher un teaser "prochain moment fort".
 */

import { DateTime } from 'luxon';
import { moonPhaseAt, type MoonPhase } from './moonPhase';

export type SmartPushKind = 'new_moon' | 'full_moon' | 'quarter_moon';

export interface SmartPushMoment {
  kind: SmartPushKind;
  /** Heure (DateTime) du moment astral. */
  at: DateTime;
  /** Phase lunaire détectée. */
  phase: MoonPhase;
  /** Titre court (≤ 50 chars) — header de notification. */
  title: string;
  /** Body (≤ 110 chars). */
  body: string;
  /** Slug pour analytics / dedup. */
  slug: string;
}

const TITLES: Record<SmartPushKind, string> = {
  new_moon: 'Nouvelle Lune ce soir',
  full_moon: 'Pleine Lune ce soir',
  quarter_moon: 'La Lune en quartier',
};

const BODIES: Record<SmartPushKind, string> = {
  new_moon:
    'Le bon moment pour planter une intention. Que veux-tu vraiment lancer ?',
  full_moon:
    'Une vague d\'émotion en vue. Laisse remonter ce qui demande à être vu.',
  quarter_moon:
    'Un point de friction utile. Ajuste, plutôt que pousser.',
};

function detectKindAt(date: Date): SmartPushKind | null {
  const phase = moonPhaseAt(date);
  if (phase.kind === 'new') return 'new_moon';
  if (phase.kind === 'full') return 'full_moon';
  if (phase.kind === 'first_quarter' || phase.kind === 'last_quarter')
    return 'quarter_moon';
  return null;
}

/**
 * Renvoie le prochain moment notable dans les `lookaheadHours` heures
 * à venir, ou `null` si rien d'intéressant.
 *
 * On scanne par pas d'1h pour rester précis sans être coûteux.
 */
export function nextSmartPushMoment(
  lookaheadHours = 36,
  from: DateTime = DateTime.now(),
): SmartPushMoment | null {
  const start = from;
  for (let h = 1; h <= lookaheadHours; h++) {
    const t = start.plus({ hours: h });
    const kind = detectKindAt(t.toJSDate());
    if (kind) {
      const phase = moonPhaseAt(t.toJSDate());
      return {
        kind,
        at: t,
        phase,
        title: TITLES[kind],
        body: BODIES[kind],
        slug: `${kind}_${t.toISODate()}`,
      };
    }
  }
  return null;
}

/**
 * Filtre serveur : décide si on PEUT envoyer un push à cet utilisateur
 * (heure raisonnable, pas déjà envoyé pour ce slug, etc.).
 *
 * À utiliser dans la fonction Netlify cron pour éviter de spammer.
 */
export function shouldSendSmartPush(opts: {
  /** Heure locale de l'utilisateur (0-23). */
  localHour: number;
  /** Slugs déjà envoyés à cet utilisateur. */
  alreadySent: string[];
  moment: SmartPushMoment;
}): boolean {
  // Pas de push entre 22h et 8h locale.
  if (opts.localHour < 8 || opts.localHour >= 22) return false;
  if (opts.alreadySent.includes(opts.moment.slug)) return false;
  return true;
}
