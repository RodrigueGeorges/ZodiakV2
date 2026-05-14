import { type CelestialMode } from '../lib/celestialMode';
import { cn } from '../lib/utils';

const MODES: { id: CelestialMode; label: string }[] = [
  { id: 'stars', label: 'Étoiles' },
  { id: 'cursor', label: 'Curseur' },
  { id: 'color', label: 'Couleur' },
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
          'pointer-events-auto flex items-center gap-0.5 rounded-full border border-white/[0.11]',
          'bg-black/55 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_8px_32px_rgba(0,0,0,0.4)]',
          'px-1.5 py-2',
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
                'rounded-full px-3.5 py-1.5 text-caption font-sans tracking-tight transition-all duration-300 ease-brutal',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-aurora-400 focus-visible:ring-offset-2 focus-visible:ring-offset-night-950',
                active
                  ? 'font-medium text-ivory-50 bg-aurora-400/18 border border-aurora-400/35 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]'
                  : 'font-normal text-ivory-400 border border-transparent hover:text-ivory-100 hover:bg-white/[0.04]',
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
