import { cn } from '../../lib/utils';

/**
 * SkeletonCard — placeholder premium pour les cartes chargement.
 * Pulse subtil, pas de flash blanc agressif.
 */
export function SkeletonCard({ className, lines = 3 }: { className?: string; lines?: number }) {
  return (
    <div className={cn('rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 space-y-4', className)}>
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-white/[0.06] animate-pulse" />
        <div className="space-y-2 flex-1">
          <div className="h-3.5 w-1/3 rounded-md bg-white/[0.06] animate-pulse" />
          <div className="h-2.5 w-1/4 rounded-md bg-white/[0.04] animate-pulse" />
        </div>
      </div>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-2.5 rounded-md bg-white/[0.04] animate-pulse"
          style={{ width: i === lines - 1 ? '60%' : '100%', animationDelay: `${i * 120}ms` }}
        />
      ))}
    </div>
  );
}

export function SkeletonText({ className, lines = 2 }: { className?: string; lines?: number }) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-2.5 rounded-md bg-white/[0.05] animate-pulse"
          style={{ width: i === lines - 1 ? '70%' : '100%', animationDelay: `${i * 100}ms` }}
        />
      ))}
    </div>
  );
}

export function SkeletonGrid({ count = 6, className }: { count?: number; className?: string }) {
  return (
    <div className={cn('grid sm:grid-cols-2 lg:grid-cols-3 gap-4', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} lines={2} />
      ))}
    </div>
  );
}

export function SkeletonPage({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-8 max-w-5xl mx-auto', className)}>
      <div className="space-y-3">
        <div className="h-3 w-24 rounded-md bg-white/[0.06] animate-pulse" />
        <div className="h-8 w-2/3 rounded-lg bg-white/[0.07] animate-pulse" />
        <div className="h-4 w-1/2 rounded-md bg-white/[0.05] animate-pulse" />
      </div>
      <SkeletonGrid count={4} />
    </div>
  );
}
