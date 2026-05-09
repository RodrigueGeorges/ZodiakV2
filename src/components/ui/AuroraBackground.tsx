import StarField from '../StarField';

/**
 * AuroraBackground v3 — alias rétrocompat vers StarField.
 *
 * Refonte (mai 2026) : les anciens halos aurora/magenta/amber + grain
 * faisaient "années 2010s". Désormais ce composant est un wrapper léger
 * autour de StarField (champ d'étoiles vivant + nébuleuse subtile).
 *
 * On conserve la signature des props pour ne pas casser les ~10 endroits
 * qui l'importent encore (Home, AuthLayout, AdminProtection, etc.).
 *
 * À terme, importer directement StarField.
 */
interface AuroraBackgroundProps {
  variant?: 'default' | 'dim';
  withGrain?: boolean;
  withStars?: boolean;
}

export default function AuroraBackground({
  variant = 'default',
  withStars = true,
}: AuroraBackgroundProps) {
  if (!withStars) return null;
  return <StarField density={variant === 'dim' ? 0.6 : 1} nebula />;
}
