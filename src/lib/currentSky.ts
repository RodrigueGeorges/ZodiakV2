/**
 * currentSky — calculs astronomiques minimaux côté client.
 *
 * On ne charge PAS astronomy-engine côté front (≈ 200kb). On utilise des
 * approximations simples basées sur des formules astro classiques :
 *   - Position écliptique du Soleil → signe + degré dans le signe
 *   - Sun ingress (date d'entrée dans chaque signe pour l'année courante)
 *
 * Précision : ±0.2° sur la longitude solaire, soit < 5h sur les ingresses.
 * Largement suffisant pour de l'affichage éditorial.
 */

import type { ZodiacSign } from '../components/ZodiacGlyph';

const SIGN_FROM_INDEX: ZodiacSign[] = [
  'aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo',
  'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces',
];

const SIGN_NAMES_FR: Record<ZodiacSign, string> = {
  aries: 'Bélier',
  taurus: 'Taureau',
  gemini: 'Gémeaux',
  cancer: 'Cancer',
  leo: 'Lion',
  virgo: 'Vierge',
  libra: 'Balance',
  scorpio: 'Scorpion',
  sagittarius: 'Sagittaire',
  capricorn: 'Capricorne',
  aquarius: 'Verseau',
  pisces: 'Poissons',
};

/**
 * Longitude écliptique apparente du Soleil (en degrés, 0..360).
 *
 * Formule : Meeus, "Astronomical Algorithms", chap. 25 (version simplifiée).
 * Précision attendue : < 0.01° pour les besoins d'affichage.
 */
export function sunLongitude(date: Date): number {
  const jd = date.getTime() / 86400000 + 2440587.5;
  const n = jd - 2451545.0;
  // Mean longitude
  const L = (280.460 + 0.9856474 * n) % 360;
  // Mean anomaly
  const g = ((357.528 + 0.9856003 * n) % 360) * (Math.PI / 180);
  // Ecliptic longitude
  let lambda = L + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g);
  lambda = ((lambda % 360) + 360) % 360;
  return lambda;
}

export interface SunSignInfo {
  sign: ZodiacSign;
  signFr: string;
  /** Degré dans le signe (0..30). */
  degree: number;
  /** Pourcentage de progression dans le signe (0..1). */
  progress: number;
  glyph: string;
}

const GLYPHS: Record<ZodiacSign, string> = {
  aries: '♈',
  taurus: '♉',
  gemini: '♊',
  cancer: '♋',
  leo: '♌',
  virgo: '♍',
  libra: '♎',
  scorpio: '♏',
  sagittarius: '♐',
  capricorn: '♑',
  aquarius: '♒',
  pisces: '♓',
};

/** Signe solaire à une date donnée + degré dans le signe. */
export function sunSignAt(date: Date): SunSignInfo {
  const lon = sunLongitude(date);
  const idx = Math.floor(lon / 30);
  const degree = lon - idx * 30;
  const sign = SIGN_FROM_INDEX[idx];
  return {
    sign,
    signFr: SIGN_NAMES_FR[sign],
    degree,
    progress: degree / 30,
    glyph: GLYPHS[sign],
  };
}

/**
 * Liste des prochaines entrées du Soleil dans un signe (sun ingress)
 * dans les `days` prochains jours.
 */
export function nextSunIngress(
  fromDate: Date,
  days = 35,
): { date: Date; sign: ZodiacSign; signFr: string; glyph: string } | null {
  const start = new Date(fromDate);
  const startInfo = sunSignAt(start);
  // On cherche le moment où on bascule vers le signe suivant.
  // Recherche binaire grossière : on évalue jour par jour, puis affinage par bisection.
  let prevSign = startInfo.sign;
  for (let i = 1; i <= days; i++) {
    const probe = new Date(start.getTime() + i * 86400000);
    const info = sunSignAt(probe);
    if (info.sign !== prevSign) {
      // Bisection sur les 24h
      let lo = new Date(start.getTime() + (i - 1) * 86400000);
      let hi = probe;
      for (let k = 0; k < 12; k++) {
        const mid = new Date((lo.getTime() + hi.getTime()) / 2);
        if (sunSignAt(mid).sign === info.sign) hi = mid;
        else lo = mid;
      }
      return {
        date: hi,
        sign: info.sign,
        signFr: info.signFr,
        glyph: info.glyph,
      };
    }
    prevSign = info.sign;
  }
  return null;
}
