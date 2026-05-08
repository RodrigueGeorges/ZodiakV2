import { memo } from 'react';
import CosmicSymbol from './CosmicSymbol';
import { cn } from '../../lib/utils';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  /** Conservé pour compat. `classic` est mappé vers `cosmic` désormais. */
  variant?: 'classic' | 'cosmic';
  style?: React.CSSProperties;
  /** Affiche le wordmark "Zodiak" à côté du glyphe. */
  withWordmark?: boolean;
  /** Couleur du wordmark, par défaut `text-ivory-50`. */
  wordmarkClassName?: string;
  /** Animation de "composition" depuis 0 (utilisé sur landing/onboarding). */
  composeOnLoad?: boolean;
}

const wrapperSize = {
  sm: 'w-8 h-8',
  md: 'w-14 h-14',
  lg: 'w-24 h-24',
};

const wordmarkSize = {
  sm: 'text-xl',
  md: 'text-2xl md:text-3xl',
  lg: 'text-4xl md:text-5xl',
};

const Logo = memo(function Logo({
  size = 'md',
  className = '',
  style,
  withWordmark = false,
  wordmarkClassName,
  composeOnLoad = false,
}: LogoProps) {
  const symbol = (
    <div
      className={cn('relative flex items-center justify-center', wrapperSize[size])}
      style={style}
    >
      <CosmicSymbol size={size} animated composeOnLoad={composeOnLoad} />
    </div>
  );

  if (!withWordmark) return <span className={className}>{symbol}</span>;

  return (
    <span className={cn('inline-flex items-center gap-3', className)}>
      {symbol}
      <span
        className={cn(
          'font-cinzel tracking-wide text-ivory-50',
          wordmarkSize[size],
          wordmarkClassName
        )}
      >
        Zodiak
      </span>
    </span>
  );
});

export { Logo };
export default Logo;
