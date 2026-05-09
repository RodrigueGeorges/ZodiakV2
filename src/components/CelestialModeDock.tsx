import { type CelestialMode } from '../lib/celestialMode';
import { cn } from '../lib/utils';

const MODES: { id: CelestialMode; label: string }[] = [
  { id: 'stars', label: 'Star Effect' },
  { id: 'cursor', label: 'Cursor Effect' },
  { id: 'color', label: 'Color Effect' },
];

interface CelestialModeDockProps {
  mode: CelestialMode;
  onChange: (mode: CelestialMode) => void;
  /** Plus de marge basse (ex. bottom nav mobile). */
  lift?: boolean;
}

/**
 * Dock glass façon démo « ciel immersif » : bas d’écran, pilule, blur.
 */
export default function CelestialModeDock({
  mode,
  onChange,
  lift = false,
}: CelestialModeDockProps) {
  return (
    <div
      className={cn(
        'fixed left-1/2 z-[95] -translate-x-1/2 pointer-events-none px-4 w-full max-w-md flex justify-center',
        lift ? 'bottom-24 safe-bottom md:bottom-8' : 'bottom-6 safe-bottom md:bottom-8',
      )}
      role="tablist"
      aria-label="Mode d’ambiance du ciel"
    >
      <div
        className={cn(
          'pointer-events-auto flex items-center gap-0.5 rounded-full border border-white/20',
          'bg-white/[0.08] backdrop-blur-md shadow-[0_8px_32px_rgba(0,0,0,0.35)]',
          'px-2 py-2.5',
        )}
      >
        {MODES.map(({ id, label }) => {
          const active = mode === id;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(id)}
              className={cn(
                'rounded-full px-3.5 py-1.5 text-[13px] font-sans transition-colors duration-200',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/50 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent',
                active
                  ? 'font-semibold text-white'
                  : 'font-normal text-zinc-400 hover:text-zinc-200',
              )}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
