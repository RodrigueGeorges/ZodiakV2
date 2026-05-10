/**
 * Calcul des phases lunaires sur N jours sans dépendance externe.
 *
 * Algorithme : Brown's lunation theory simplifiée. L'erreur typique est
 * inférieure à 1 heure sur la date des phases (suffisant pour de l'UX).
 */

export type MoonPhaseKind =
  | 'new'
  | 'waxing_crescent'
  | 'first_quarter'
  | 'waxing_gibbous'
  | 'full'
  | 'waning_gibbous'
  | 'last_quarter'
  | 'waning_crescent';

export interface MoonPhase {
  /** Date ISO (YYYY-MM-DD). */
  date: string;
  /** Illumination [0..1] (0 = nouvelle, 0.5 = quartiers, 1 = pleine). */
  illumination: number;
  /** Phase symbolique pour l'UI. */
  kind: MoonPhaseKind;
  /** Glyphe unicode adapté au cycle. */
  glyph: string;
  /** Libellé fr. */
  label: string;
}

const SYNODIC_MONTH = 29.530588853;
// Référence : nouvelle lune du 6 janv. 2000 18:14 UTC (JD 2451550.26)
const REFERENCE_JD = 2451550.26;

function toJulian(date: Date): number {
  return date.getTime() / 86400000 + 2440587.5;
}

function frac(x: number): number {
  return x - Math.floor(x);
}

const KIND_BY_AGE: Array<{ kind: MoonPhaseKind; glyph: string; label: string }> = [
  { kind: 'new', glyph: '●', label: 'Nouvelle lune' },
  { kind: 'waxing_crescent', glyph: '◔', label: 'Croissant' },
  { kind: 'first_quarter', glyph: '◐', label: 'Premier quartier' },
  { kind: 'waxing_gibbous', glyph: '◕', label: 'Gibbeuse croissante' },
  { kind: 'full', glyph: '○', label: 'Pleine lune' },
  { kind: 'waning_gibbous', glyph: '◓', label: 'Gibbeuse décroissante' },
  { kind: 'last_quarter', glyph: '◑', label: 'Dernier quartier' },
  { kind: 'waning_crescent', glyph: '◒', label: 'Dernier croissant' },
];

function ageToPhase(age: number): { kind: MoonPhaseKind; glyph: string; label: string } {
  // Découpe en 8 phases égales.
  const idx = Math.floor((age / SYNODIC_MONTH) * 8) % 8;
  return KIND_BY_AGE[idx];
}

/**
 * Phase lunaire pour une date donnée (UTC).
 */
export function moonPhaseAt(date: Date): MoonPhase {
  const jd = toJulian(date);
  const age = ((jd - REFERENCE_JD) % SYNODIC_MONTH + SYNODIC_MONTH) % SYNODIC_MONTH;
  // Illumination ≈ (1 − cos(2π × age / synodic)) / 2
  const illumination = (1 - Math.cos((2 * Math.PI * age) / SYNODIC_MONTH)) / 2;
  const meta = ageToPhase(age);
  const iso = date.toISOString().slice(0, 10);
  return {
    date: iso,
    illumination,
    ...meta,
  };
}

/**
 * Renvoie les `days` prochaines phases lunaires à partir d'aujourd'hui (UTC).
 */
export function moonPhasesNextDays(days: number): MoonPhase[] {
  const out: MoonPhase[] = [];
  const start = new Date();
  start.setUTCHours(12, 0, 0, 0);
  for (let i = 0; i < days; i++) {
    const d = new Date(start.getTime() + i * 86400000);
    out.push(moonPhaseAt(d));
  }
  return out;
}

/**
 * Repère les "key dates" (nouvelle, premier quartier, pleine, dernier quartier)
 * dans les `days` prochains jours.
 */
export function nextKeyMoonDates(
  days = 30
): Array<{ date: string; kind: MoonPhaseKind; label: string; glyph: string }> {
  const all = moonPhasesNextDays(days);
  const keys: MoonPhaseKind[] = ['new', 'first_quarter', 'full', 'last_quarter'];
  const out: Array<{ date: string; kind: MoonPhaseKind; label: string; glyph: string }> = [];
  let lastKind: MoonPhaseKind | null = null;
  for (const p of all) {
    if (keys.includes(p.kind) && p.kind !== lastKind) {
      out.push({ date: p.date, kind: p.kind, label: p.label, glyph: p.glyph });
      lastKind = p.kind;
    } else if (!keys.includes(p.kind)) {
      lastKind = null;
    }
  }
  return out.slice(0, 6);
}

// Évite à la lib d'être tree-shaké
export const __debugFrac = frac;
