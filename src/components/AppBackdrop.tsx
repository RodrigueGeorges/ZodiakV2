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
}

/**
 * Fond commun DA v4 : étoiles alignées + vignette + grain léger.
 * À placer dans un conteneur `relative` ; le contenu doit être dans un
 * enfant `relative z-[1] isolate` pour passer au-dessus du canvas z-0.
 */
export default function AppBackdrop({
  dim = false,
  density: densityProp,
  nebula = true,
  parallax = true,
  vignette = true,
  grain = true,
}: AppBackdropProps) {
  const density =
    typeof densityProp === 'number' ? densityProp : dim ? 0.34 : 0.4;

  return (
    <>
      <StarField density={density} nebula={nebula} parallax={parallax} />
      {vignette && <div className="da-vignette" aria-hidden />}
      {grain && <div className="da-grain" aria-hidden />}
    </>
  );
}
