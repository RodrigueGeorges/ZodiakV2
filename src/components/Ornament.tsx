import { cn } from '../lib/utils';

interface OrnamentProps {
  className?: string;
  /** Variante du motif central. Défaut: rosette. */
  variant?: 'rosette' | 'star6' | 'eye' | 'fleuron';
  /** Taille en pixels du motif central. */
  size?: number;
  /** Opacité du filet horizontal. */
  ruleOpacity?: number;
}

/**
 * Ornament — séparateur ornemental entre chapitres.
 *
 * Une motif central en or (rosette / étoile 6 branches / œil / fleuron)
 * encadré par deux filets horizontaux qui s'estompent. Façon livre relié
 * ou planche d'astronomie ancienne.
 *
 * S'utilise EN REMPLACEMENT d'un border-t classique entre sections,
 * ou de manière standalone pour ponctuer une lecture.
 *
 * Usage :
 *   <Ornament variant="star6" />
 *   <Ornament variant="rosette" size={28} />
 */
export default function Ornament({
  className,
  variant = 'rosette',
  size = 22,
  ruleOpacity = 0.35,
}: OrnamentProps) {
  return (
    <div
      role="separator"
      aria-hidden="true"
      className={cn(
        'flex items-center justify-center gap-5 w-full max-w-md mx-auto py-4',
        className,
      )}
    >
      <span
        className="flex-1 h-px"
        style={{
          background: `linear-gradient(to right, transparent, rgba(212, 166, 86, ${ruleOpacity}), transparent)`,
        }}
      />
      <OrnamentMark variant={variant} size={size} />
      <span
        className="flex-1 h-px"
        style={{
          background: `linear-gradient(to right, transparent, rgba(212, 166, 86, ${ruleOpacity}), transparent)`,
        }}
      />
    </div>
  );
}

interface OrnamentMarkProps {
  variant: NonNullable<OrnamentProps['variant']>;
  size: number;
}

function OrnamentMark({ variant, size }: OrnamentMarkProps) {
  switch (variant) {
    case 'star6':
      return (
        <svg
          viewBox="-50 -50 100 100"
          width={size}
          height={size}
          aria-hidden="true"
        >
          {/* Étoile à 6 branches (Sceau de Salomon stylisé) */}
          <g
            fill="none"
            stroke="rgba(212, 166, 86, 0.85)"
            strokeWidth="1.4"
            strokeLinejoin="round"
          >
            <polygon points="0,-40 35,20 -35,20" />
            <polygon points="0,40 35,-20 -35,-20" />
          </g>
          <circle r="3" cx="0" cy="0" fill="rgba(212, 166, 86, 0.95)" />
        </svg>
      );

    case 'eye':
      return (
        <svg
          viewBox="-50 -25 100 50"
          width={size * 1.6}
          height={size * 0.8}
          aria-hidden="true"
        >
          <ellipse
            cx="0"
            cy="0"
            rx="38"
            ry="14"
            fill="none"
            stroke="rgba(212, 166, 86, 0.8)"
            strokeWidth="1.2"
          />
          <circle r="6" cx="0" cy="0" fill="rgba(212, 166, 86, 0.8)" />
          <circle r="2" cx="0" cy="0" fill="#0A0814" />
        </svg>
      );

    case 'fleuron':
      return (
        <svg
          viewBox="-50 -50 100 100"
          width={size * 1.3}
          height={size}
          aria-hidden="true"
        >
          <g
            fill="none"
            stroke="rgba(212, 166, 86, 0.85)"
            strokeWidth="1.3"
            strokeLinecap="round"
          >
            {/* Branches courbes type fleuron typographique */}
            <path d="M -42 0 C -28 -14, -14 -14, 0 0 C 14 -14, 28 -14, 42 0" />
            <path d="M -42 0 C -28 14, -14 14, 0 0 C 14 14, 28 14, 42 0" />
            <circle r="2.4" cx="0" cy="0" fill="rgba(212, 166, 86, 0.95)" />
            <circle r="1.6" cx="-30" cy="0" fill="rgba(212, 166, 86, 0.7)" />
            <circle r="1.6" cx="30" cy="0" fill="rgba(212, 166, 86, 0.7)" />
          </g>
        </svg>
      );

    case 'rosette':
    default:
      return (
        <svg
          viewBox="-50 -50 100 100"
          width={size}
          height={size}
          aria-hidden="true"
        >
          {/* Rosette 8 pétales fins */}
          <g
            fill="none"
            stroke="rgba(212, 166, 86, 0.75)"
            strokeWidth="1"
            strokeLinecap="round"
          >
            {Array.from({ length: 8 }).map((_, i) => {
              const angle = (i / 8) * Math.PI * 2;
              const x = Math.cos(angle) * 32;
              const y = Math.sin(angle) * 32;
              return (
                <line
                  key={i}
                  x1="0"
                  y1="0"
                  x2={x}
                  y2={y}
                />
              );
            })}
            <circle r="20" cx="0" cy="0" />
            <circle r="32" cx="0" cy="0" strokeOpacity="0.5" />
          </g>
          <circle r="3" cx="0" cy="0" fill="rgba(212, 166, 86, 0.95)" />
        </svg>
      );
  }
}
