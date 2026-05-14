import { cn } from '../../lib/utils';

/**
 * Skeleton — placeholder shimmer aurora.
 *
 * Usage typique :
 *   <Skeleton className="h-6 w-3/4" />
 *   <Skeleton className="h-32 w-full" rounded="2xl" />
 */
interface SkeletonProps {
  className?: string;
  rounded?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  /** Désactive l'animation (utile pour preview ou test). */
  static?: boolean;
}

const roundedMap: Record<NonNullable<SkeletonProps['rounded']>, string> = {
  sm: 'rounded-lg',
  md: 'rounded-lg',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  '2xl': 'rounded-2xl',
  full: 'rounded-full',
};

export function Skeleton({
  className,
  rounded = 'md',
  static: isStatic,
}: SkeletonProps) {
  return (
    <div
      role="presentation"
      aria-hidden="true"
      className={cn(
        'relative overflow-hidden bg-night-800',
        roundedMap[rounded],
        className
      )}
    >
      {!isStatic && (
        <div
          className="absolute inset-0 -translate-x-full animate-shimmer"
          style={{
            background:
              'linear-gradient(90deg, transparent 0%, rgba(199,178,255,0.08) 35%, rgba(232,74,147,0.08) 65%, transparent 100%)',
            backgroundSize: '200% 100%',
          }}
        />
      )}
    </div>
  );
}

/**
 * SkeletonText — bloc texte 3 lignes.
 */
export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            'h-3.5',
            i === lines - 1 ? 'w-2/3' : 'w-full'
          )}
        />
      ))}
    </div>
  );
}

export default Skeleton;
