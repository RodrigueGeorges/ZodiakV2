import AuroraBackground from './ui/AuroraBackground';

/**
 * Alias rétrocompat. Le composant historique a été remplacé par
 * `AuroraBackground` (ui/AuroraBackground) dans la DA "Cosmic Editorial" v2.
 *
 * Ne plus importer `StarryBackground` dans le code neuf — utilise directement
 * `AuroraBackground` depuis `components/ui`.
 */
export function StarryBackground() {
  return <AuroraBackground />;
}

export default StarryBackground;
