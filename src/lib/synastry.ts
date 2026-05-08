/**
 * Calcul de synastrie (aspects entre deux cartes natales).
 *
 * On considère les 7 corps lents/personnels classiques + l'ascendant, et
 * on cherche les 5 aspects majeurs : conjonction, opposition, trigone, carré,
 * sextile. Chaque aspect a un orbe (tolérance) et un poids signé qui alimente
 * un score 0–100.
 *
 * C'est un wrapper léger : on prend des `NatalChart` déjà calculés (par le
 * back via `_astroEngine.computeNatalChart`). Le front utilise ce module pour
 * dériver score + résumé en local — pas d'appel réseau.
 */

export type PlanetKey =
  | 'sun'
  | 'moon'
  | 'mercury'
  | 'venus'
  | 'mars'
  | 'jupiter'
  | 'saturn'
  | 'ascendant';

export type AspectKind =
  | 'conjunction'
  | 'opposition'
  | 'trine'
  | 'square'
  | 'sextile';

export interface Aspect {
  a: PlanetKey;
  b: PlanetKey;
  kind: AspectKind;
  /** Différence d'angle (-180..180), normalisée. */
  exactness: number;
  /** Poids appliqué au score (positif = harmonie, négatif = friction). */
  weight: number;
  /** Label francisé pour l'UI. */
  label: string;
}

export interface PlanetLong {
  longitude: number;
  retrograde?: boolean;
}

export type ChartLite = Partial<Record<PlanetKey, PlanetLong>>;

interface AspectDef {
  kind: AspectKind;
  angle: number;
  orb: number;
  baseWeight: number;
  label: string;
}

const ASPECTS: AspectDef[] = [
  { kind: 'conjunction', angle: 0, orb: 8, baseWeight: 4, label: 'Conjonction' },
  { kind: 'opposition', angle: 180, orb: 7, baseWeight: -3, label: 'Opposition' },
  { kind: 'trine', angle: 120, orb: 6, baseWeight: 4, label: 'Trigone' },
  { kind: 'square', angle: 90, orb: 6, baseWeight: -3, label: 'Carré' },
  { kind: 'sextile', angle: 60, orb: 4, baseWeight: 2, label: 'Sextile' },
];

const PLANETS: PlanetKey[] = [
  'sun',
  'moon',
  'mercury',
  'venus',
  'mars',
  'jupiter',
  'saturn',
  'ascendant',
];

/** Importance relative de chaque planète dans la synastrie (multiplicateur). */
const PLANET_WEIGHT: Record<PlanetKey, number> = {
  sun: 1.4,
  moon: 1.5,
  ascendant: 1.3,
  venus: 1.4,
  mars: 1.2,
  mercury: 1.0,
  jupiter: 0.9,
  saturn: 0.9,
};

/** Différence angulaire signée [-180, 180]. */
function angleDiff(a: number, b: number): number {
  let d = ((a - b) % 360 + 540) % 360 - 180;
  if (d === -180) d = 180;
  return d;
}

function findAspect(deltaAbs: number): AspectDef | null {
  for (const def of ASPECTS) {
    if (Math.abs(deltaAbs - def.angle) <= def.orb) return def;
  }
  return null;
}

/**
 * Calcule tous les aspects et un score 0–100 entre deux cartes.
 *
 * Logique du score :
 *   - On somme `baseWeight × planetWeightA × planetWeightB × strength`
 *     où `strength` ∈ [0, 1] dépend de l'exactitude (orbe).
 *   - On clamp en [0, 100] avec une fonction sigmoïdale ancrée à 50.
 */
export function computeSynastry(a: ChartLite, b: ChartLite): {
  aspects: Aspect[];
  rawScore: number;
  score: number;
} {
  const aspects: Aspect[] = [];
  let raw = 0;

  for (const pa of PLANETS) {
    const A = a[pa];
    if (!A) continue;
    for (const pb of PLANETS) {
      const B = b[pb];
      if (!B) continue;
      const delta = Math.abs(angleDiff(A.longitude, B.longitude));
      const def = findAspect(delta);
      if (!def) continue;

      const exact = Math.abs(delta - def.angle);
      const strength = Math.max(0, 1 - exact / def.orb);
      const weight =
        def.baseWeight * PLANET_WEIGHT[pa] * PLANET_WEIGHT[pb] * strength;

      aspects.push({
        a: pa,
        b: pb,
        kind: def.kind,
        exactness: angleDiff(A.longitude, B.longitude),
        weight: parseFloat(weight.toFixed(2)),
        label: def.label,
      });
      raw += weight;
    }
  }

  // Sigmoïde centrée sur 0, ancrée à 50.
  const score = Math.round(100 / (1 + Math.exp(-raw / 8)));

  return { aspects, rawScore: parseFloat(raw.toFixed(2)), score };
}

/**
 * Sélectionne les highlights : 3 plus belles harmonies + 2 frictions, triées
 * par valeur absolue de poids. Sert à composer le résumé éditorial.
 */
export function pickHighlights(aspects: Aspect[]): {
  harmonies: Aspect[];
  frictions: Aspect[];
} {
  const sorted = [...aspects].sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight));
  const harmonies = sorted.filter((a) => a.weight > 0).slice(0, 3);
  const frictions = sorted.filter((a) => a.weight < 0).slice(0, 2);
  return { harmonies, frictions };
}

const PLANET_LABEL: Record<PlanetKey, string> = {
  sun: 'Soleil',
  moon: 'Lune',
  mercury: 'Mercure',
  venus: 'Vénus',
  mars: 'Mars',
  jupiter: 'Jupiter',
  saturn: 'Saturne',
  ascendant: 'Asc',
};

export function aspectLabel(a: Aspect, who1 = 'toi', who2 = 'l\'autre'): string {
  return `${PLANET_LABEL[a.a]} de ${who1} ${a.label.toLowerCase()} ${PLANET_LABEL[a.b]} de ${who2}`;
}

/**
 * Phrase courte qui résume le score, utilisée comme sous-titre dans la card.
 */
export function scoreVerdict(score: number): string {
  if (score >= 85) return 'Lien rare, presque magnétique.';
  if (score >= 72) return 'Belle alchimie, à cultiver.';
  if (score >= 58) return 'Lien lumineux, avec quelques nuances.';
  if (score >= 45) return 'Mélange contrasté — c\'est riche.';
  if (score >= 32) return 'Plus complexe, mais formateur.';
  return 'Tension utile pour grandir.';
}
