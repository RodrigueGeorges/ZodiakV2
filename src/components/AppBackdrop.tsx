/**
 * Surcouches optionnelles (vignette, grain). Le champ d’étoiles + constellations
 * est monté une seule fois dans `App.tsx` pour éviter les bugs avec Framer Motion
 * (`transform` sur le parent des routes casse les `canvas` fixed).
 */
interface AppBackdropProps {
  vignette?: boolean;
  grain?: boolean;
}

export default function AppBackdrop({
  vignette = false,
  grain = false,
}: AppBackdropProps) {
  return (
    <>
      {vignette && <div className="da-vignette" aria-hidden />}
      {grain && <div className="da-grain" aria-hidden />}
    </>
  );
}
