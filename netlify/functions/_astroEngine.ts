/**
 * Calcul astrologique LOCAL — basé sur `astronomy-engine` (MIT, JS pur).
 *
 * Pourquoi local ?
 *   - 0 € de runtime (vs Prokerala : 1 appel par utilisateur/jour minimum).
 *   - Latence ~5 ms vs ~200-800 ms réseau.
 *   - Précision ~1 arc minute, largement suffisante pour de la guidance grand
 *     public (le grand public ne fait pas la différence sub-degré).
 *
 * Ce module remplace l'appel à Prokerala/`calculateDailyTransits` pour les
 * positions du soleil, de la lune et des 5 planètes lentes (rapides + Mars
 * + Jupiter + Saturne) qui composent les transits quotidiens.
 *
 * Le thème natal détaillé (12 maisons en système Placidus) est laissé pour
 * une seconde itération — pour l'instant on utilise des **maisons "Whole sign"**
 * qui sont astrologiquement légitimes (système hellénistique) et triviales :
 * la maison N = signe situé N-1 places après le signe de l'Ascendant.
 */

import * as Astronomy from 'astronomy-engine';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type ZodiacSign =
  | 'Bélier'
  | 'Taureau'
  | 'Gémeaux'
  | 'Cancer'
  | 'Lion'
  | 'Vierge'
  | 'Balance'
  | 'Scorpion'
  | 'Sagittaire'
  | 'Capricorne'
  | 'Verseau'
  | 'Poissons';

export interface PlanetPosition {
  sign: ZodiacSign;
  /** Degré DANS le signe (0..30). */
  degree: number;
  /** Longitude écliptique absolue (0..360). */
  longitude: number;
  house?: number;
  retrograde: boolean;
}

export interface DailyTransits {
  sun: PlanetPosition;
  moon: PlanetPosition;
  mercury: PlanetPosition;
  venus: PlanetPosition;
  mars: PlanetPosition;
  jupiter: PlanetPosition;
  saturn: PlanetPosition;
}

export interface NatalChart extends DailyTransits {
  ascendant: PlanetPosition;
  midheaven: PlanetPosition;
  /** Système Whole-sign (maison N = N-ième signe à partir de l'Asc). */
  houses: PlanetPosition[];
}

const SIGNS_FR: ZodiacSign[] = [
  'Bélier',
  'Taureau',
  'Gémeaux',
  'Cancer',
  'Lion',
  'Vierge',
  'Balance',
  'Scorpion',
  'Sagittaire',
  'Capricorne',
  'Verseau',
  'Poissons',
];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Normalise un angle dans [0, 360). */
function norm360(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

/** Convertit une longitude écliptique en signe + degré dans le signe. */
export function longitudeToSign(longitude: number): { sign: ZodiacSign; degree: number } {
  const lon = norm360(longitude);
  const idx = Math.floor(lon / 30);
  return { sign: SIGNS_FR[idx], degree: lon - idx * 30 };
}

/**
 * Calcule la longitude écliptique géocentrique d'un corps céleste.
 * Soleil/Lune utilisent les helpers spécialisés (plus précis), les autres
 * passent par GeoVector + conversion en coordonnées écliptiques.
 */
function eclipticLongitude(body: Astronomy.Body, time: Astronomy.AstroTime): number {
  if (body === Astronomy.Body.Sun) {
    return Astronomy.SunPosition(time).elon;
  }
  if (body === Astronomy.Body.Moon) {
    const v = Astronomy.GeoMoon(time);
    return Astronomy.Ecliptic(v).elon;
  }
  const v = Astronomy.GeoVector(body, time, /* aberration */ true);
  return Astronomy.Ecliptic(v).elon;
}

/**
 * Détecte la rétrogradation : compare la longitude à T-1 jour et T+1 jour.
 * Si la différence est négative (longitude diminue), la planète est en
 * mouvement rétrograde. Sun et Moon ne rétrogradent jamais.
 */
function isRetrograde(body: Astronomy.Body, time: Astronomy.AstroTime): boolean {
  if (body === Astronomy.Body.Sun || body === Astronomy.Body.Moon) return false;

  const before = eclipticLongitude(body, time.AddDays(-1));
  const after = eclipticLongitude(body, time.AddDays(1));
  // delta normalisé dans [-180, 180]
  let delta = after - before;
  if (delta > 180) delta -= 360;
  if (delta < -180) delta += 360;
  return delta < 0;
}

function buildPosition(body: Astronomy.Body, time: Astronomy.AstroTime): PlanetPosition {
  const longitude = eclipticLongitude(body, time);
  const { sign, degree } = longitudeToSign(longitude);
  return {
    sign,
    degree,
    longitude,
    retrograde: isRetrograde(body, time),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// API publique
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calcule les transits du jour (positions planétaires à 12:00 UTC).
 *
 * @param date  format YYYY-MM-DD ou ISO date
 */
export function computeDailyTransitsLocal(date: string): DailyTransits {
  const isoNoon = date.includes('T') ? date : `${date}T12:00:00Z`;
  const time = new Astronomy.AstroTime(new Date(isoNoon));

  return {
    sun: buildPosition(Astronomy.Body.Sun, time),
    moon: buildPosition(Astronomy.Body.Moon, time),
    mercury: buildPosition(Astronomy.Body.Mercury, time),
    venus: buildPosition(Astronomy.Body.Venus, time),
    mars: buildPosition(Astronomy.Body.Mars, time),
    jupiter: buildPosition(Astronomy.Body.Jupiter, time),
    saturn: buildPosition(Astronomy.Body.Saturn, time),
  };
}

/**
 * Calcule le thème natal complet d'un utilisateur.
 *
 * Système de maisons : **Whole-sign** (maison 1 = signe de l'Asc).
 * Pour Placidus, voir le TODO en bas de ce fichier.
 *
 * @param birthDateIso ISO 8601 avec tz, ex: "1990-03-15T14:30:00+01:00"
 * @param latitude     latitude géographique en degrés (négatif = sud)
 * @param longitude    longitude géographique en degrés (négatif = ouest)
 */
export function computeNatalChart(
  birthDateIso: string,
  latitude: number,
  longitude: number
): NatalChart {
  const time = new Astronomy.AstroTime(new Date(birthDateIso));

  const transits = computeDailyTransitsLocal(birthDateIso);

  // --- Ascendant et Milieu du Ciel ---
  // Local Sidereal Time en degrés
  const gst = Astronomy.SiderealTime(time); // heures
  const lst = norm360(gst * 15 + longitude); // degrés
  const obliquityRad = degToRad(23.4392911);

  // RAMC = LST en degrés
  // MC = atan2(sin(RAMC), cos(RAMC) * cos(ε))
  const ramcRad = degToRad(lst);
  const mcRad = Math.atan2(Math.sin(ramcRad), Math.cos(ramcRad) * Math.cos(obliquityRad));
  const mcLon = norm360(radToDeg(mcRad));

  // Asc = atan2(cos(RAMC), -(sin(ε) tan(lat) + cos(ε) sin(RAMC)))
  const latRad = degToRad(latitude);
  const ascRad = Math.atan2(
    Math.cos(ramcRad),
    -(Math.sin(obliquityRad) * Math.tan(latRad) + Math.cos(obliquityRad) * Math.sin(ramcRad))
  );
  let ascLon = norm360(radToDeg(ascRad));
  // L'Asc doit être dans l'hémisphère Est : si la formule retourne un point
  // de l'hémisphère Ouest, on ajoute 180°.
  // Heuristique : l'Asc est "à l'est" du MC.
  if (Math.abs(ascLon - mcLon) < 90 || Math.abs(ascLon - mcLon) > 270) {
    ascLon = norm360(ascLon + 180);
  }

  const ascSign = longitudeToSign(ascLon);
  const mcSign = longitudeToSign(mcLon);

  const ascendant: PlanetPosition = {
    sign: ascSign.sign,
    degree: ascSign.degree,
    longitude: ascLon,
    retrograde: false,
  };
  const midheaven: PlanetPosition = {
    sign: mcSign.sign,
    degree: mcSign.degree,
    longitude: mcLon,
    retrograde: false,
  };

  // --- Maisons Whole-sign : la maison 1 commence à 0° du signe de l'Asc ---
  const ascSignIdx = SIGNS_FR.indexOf(ascSign.sign);
  const houses: PlanetPosition[] = Array.from({ length: 12 }, (_, i) => {
    const signIdx = (ascSignIdx + i) % 12;
    const cuspLon = signIdx * 30;
    return {
      sign: SIGNS_FR[signIdx],
      degree: 0,
      longitude: cuspLon,
      retrograde: false,
    };
  });

  // Assigner une maison à chaque planète
  const allBodies = [transits.sun, transits.moon, transits.mercury, transits.venus,
                     transits.mars, transits.jupiter, transits.saturn];
  for (const planet of allBodies) {
    const planetSignIdx = SIGNS_FR.indexOf(planet.sign);
    planet.house = ((planetSignIdx - ascSignIdx + 12) % 12) + 1;
  }

  return {
    ...transits,
    ascendant,
    midheaven,
    houses,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Utils trigo
// ─────────────────────────────────────────────────────────────────────────────

function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}
function radToDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}

// ─────────────────────────────────────────────────────────────────────────────
// TODO Placidus (itération 2)
// ─────────────────────────────────────────────────────────────────────────────
// Le système Placidus calcule les cuspides intermédiaires (II, III, V, VI, VIII,
// IX, XI, XII) en divisant en 3 le temps mis par chaque degré de l'écliptique
// pour passer du méridien à l'horizon. Formule itérative, ~50 lignes, mais
// non bloquant pour le MVP : Whole-sign donne des résultats astrologiquement
// solides et plus stables aux latitudes élevées.
