import { cn } from '../lib/utils';

interface SectionDividerProps {
  className?: string;
}

/**
 * Filet ornemental horizontal — trois losanges dorés façon carte céleste.
 */
export default function SectionDivider({ className }: SectionDividerProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'flex items-center justify-center gap-6 py-3 md:py-4',
        className,
      )}
    >
      <DiamondLine side="left" />
      <span
        aria-hidden="true"
        className="h-px w-[min(20vw,7rem)] bg-gradient-to-r from-transparent via-aurora-400/45 to-transparent"
      />
      <svg
        width="52"
        height="12"
        viewBox="0 0 52 12"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="shrink-0 text-aurora-400/85"
      >
          { cx: 6, op: 0.5 },
          { cx: 26, op: 0.85 },
          { cx: 46, op: 0.5 },
        ].map(({ cx, op }, i) => (
          <g key={i} transform={`translate(${cx}, 6)`}>
            <path
              d="M0 -3.8L3.8 0L0 3.8L-3.8 0Z"
              fill="currentColor"
              fillOpacity={op}
            />
          </g>
        ))}
      </svg>
      <span
        aria-hidden="true"
        className="h-px w-[min(20vw,7rem)] bg-gradient-to-r from-transparent via-aurora-400/45 to-transparent"
      />
      <DiamondLine side="right" />
    </div>
  );
}

function DiamondLine({ side }: { side: 'left' | 'right' }) {
  return (
    <span
      aria-hidden="true"
      className={
        side === 'left'
          ? 'hidden sm:block h-px w-[min(8vw,3rem)] bg-gradient-to-l from-aurora-400/35 to-transparent'
          : 'hidden sm:block h-px w-[min(8vw,3rem)] bg-gradient-to-r from-aurora-400/35 to-transparent'
      }
    />
  );
}
