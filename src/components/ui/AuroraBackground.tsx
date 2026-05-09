import AppBackdrop from '../AppBackdrop';

/**
 * AuroraBackground — alias rétrocompat : délègue à AppBackdrop (DA v4).
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
