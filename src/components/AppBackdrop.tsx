import StarField from './StarField';

interface AppBackdropProps {
  /** Réduit un peu la densité des étoiles (formulaires, listes denses). */
  dim?: boolean;
  /** Surcharge manuelle (ex. landing 0.32). */
  density?: number;
  nebula?: boolean;
  parallax?: boolean;
  vignette?: boolean;
  grain?: boolean;
  /** Bande diffuse type Voie lactée (ciel « premium »). */
  milkyWay?: boolean;
  /** Lignes entre repères — motifs zodiacaux stylisés (12). */
  constellations?: boolean;
  /** Silhouette de relief en bas d’écran (comme références paysage). */
  mountains?: boolean;
  /** Étoiles filantes occasionnelles (désactivé si reduced-motion). */
  shootingStars?: boolean;
}

/**
 * Fond commun : champ d’étoiles 2D, options nébuleuse / Voie lactée / traits zodiac /
 * silhouette montagne (voir `StarField`).
 * Par défaut léger pour ne pas concurrencer le curseur WebGL global.
 * À placer dans un conteneur `relative` ; le contenu doit être dans un enfant
 * `relative z-[1] isolate` pour passer au-dessus du canvas z-0.
 */
export default function AppBackdrop({
  dim = false,
  density: densityProp,
  nebula = false,
  parallax = true,
  vignette = false,
  grain = false,
  milkyWay = false,
  constellations = false,
  mountains = false,
  shootingStars = false,
}: AppBackdropProps) {
  const density =
    typeof densityProp === 'number' ? densityProp : dim ? 0.02 : 0.04;

  return (
    <>
      <StarField
        density={density}
        nebula={nebula}
        parallax={parallax}
        milkyWay={milkyWay}
        constellations={constellations}
        mountains={mountains}
        shootingStars={shootingStars}
      />
      {vignette && <div className="da-vignette" aria-hidden />}
      {grain && <div className="da-grain" aria-hidden />}
    </>
  );
}
