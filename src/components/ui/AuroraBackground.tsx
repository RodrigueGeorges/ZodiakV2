import AppBackdrop from '../AppBackdrop';

/**
 * AuroraBackground — délègue à AppBackdrop (champ d’étoiles / options grain).
 */
interface AuroraBackgroundProps {
  variant?: 'default' | 'dim';
  withGrain?: boolean;
  withStars?: boolean;
}

export default function AuroraBackground({
  variant = 'default',
  withStars = true,
  withGrain = true,
}: AuroraBackgroundProps) {
  if (!withStars) return null;
  return (
    <AppBackdrop
      dim={variant === 'dim'}
      grain={withGrain}
      vignette={withGrain}
    />
  );
}
