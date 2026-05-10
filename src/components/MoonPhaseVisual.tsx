import { memo, useId, useMemo } from 'react';
import type { MoonPhase } from '../lib/moonPhase';
import { cn } from '../lib/utils';

/**
 * Lune vectorielle (phase astronomique réelle) — remplace les emoji 🌑…🌕.
 * Charte « aurora » : argent / glace ; variante « selene » : chaud type LiveSky.
 */
export interface MoonPhaseVisualProps {
  phase: MoonPhase;
  size?: 'sm' | 'md' | 'lg';
  /** aurora = signature Zodiak (défaut) ; selene = crème doré type almanach */
  variant?: 'aurora' | 'selene';
  /** Anneau fin type instrument (recommandé md+) */
  instrumentRing?: boolean;
  className?: string;
  title?: string;
}

const SIZE_PX = { sm: 36, md: 48, lg: 64 } as const;

function MoonPhaseVisualInner({
  phase,
  size = 'md',
  variant = 'aurora',
  instrumentRing = true,
  className,
  title,
}: MoonPhaseVisualProps) {
  const rawId = useId();
  const uid = useMemo(() => rawId.replace(/[^a-zA-Z0-9]/g, ''), [rawId]);

  const { illumination, kind } = phase;
  const R = 100;

  const isWaning = kind.startsWith('waning') || kind === 'last_quarter';
  const phaseAngle = Math.PI * (1 - illumination);
  const rx = Math.abs(Math.cos(phaseAngle)) * R;
  const isNew = kind === 'new' || illumination < 0.02;
  const isFull = kind === 'full' || illumination > 0.98;
  const isCrescent = !isNew && !isFull && illumination < 0.5;
  const isGibbous = !isNew && !isFull && illumination > 0.5;
  const shadowOnLeft = !isWaning && !isNew;

  const craters = useMemo(
    () => [
      { cx: -0.2, cy: -0.3, r: 0.12, a: variant === 'aurora' ? 0.14 : 0.18 },
      { cx: 0.18, cy: -0.2, r: 0.15, a: variant === 'aurora' ? 0.16 : 0.2 },
      { cx: -0.1, cy: 0.26, r: 0.18, a: variant === 'aurora' ? 0.12 : 0.18 },
      { cx: 0.28, cy: 0.38, r: 0.09, a: 0.12 },
      { cx: -0.38, cy: -0.06, r: 0.06, a: 0.1 },
    ],
    [variant],
  );

  const px = SIZE_PX[size];
  const ringPad = instrumentRing ? 22 : 0;
  const vb = -(R + ringPad);
  const vbSize = (R + ringPad) * 2;

  const surfaceId = `mp-surf-${uid}`;
  const shadowId = `mp-sh-${uid}`;
  const glowId = `mp-gl-${uid}`;
  const earthId = `mp-earth-${uid}`;
  const maskId = `mp-mask-${uid}`;

  const label = title ?? `Phase lunaire : ${phase.label}`;

  return (
    <svg
      width={px}
      height={px}
      viewBox={`${vb} ${vb} ${vbSize} ${vbSize}`}
      className={cn('shrink-0 overflow-visible', className)}
      role="img"
      aria-label={label}
    >
      <title>{label}</title>
      <defs>
        {variant === 'aurora' ? (
          <radialGradient id={surfaceId} cx="38%" cy="32%" r="78%">
            <stop offset="0%" stopColor="#f8fafc" />
            <stop offset="35%" stopColor="#cbd5e1" />
            <stop offset="68%" stopColor="#64748b" />
            <stop offset="100%" stopColor="#334155" />
          </radialGradient>
        ) : (
          <radialGradient id={surfaceId} cx="35%" cy="30%" r="80%">
            <stop offset="0%" stopColor="#FFF7E5" />
            <stop offset="35%" stopColor="#F4E5C2" />
            <stop offset="70%" stopColor="#D4BC88" />
            <stop offset="100%" stopColor="#8A7654" />
          </radialGradient>
        )}

        <radialGradient id={shadowId} cx="50%" cy="50%" r="56%">
          <stop offset="0%" stopColor="#0a0a0b" />
          <stop offset="100%" stopColor="#000000" />
        </radialGradient>

        <radialGradient id={glowId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(255,255,255,0)" />
          <stop offset="70%" stopColor="rgba(255,255,255,0)" />
          <stop
            offset="100%"
            stopColor={
              variant === 'aurora'
                ? 'rgba(56, 189, 248, 0.22)'
                : 'rgba(170, 133, 88, 0.32)'
            }
          />
        </radialGradient>

        <radialGradient id={earthId} cx="50%" cy="50%" r="65%">
          <stop offset="0%" stopColor="rgba(148, 163, 184, 0)" />
          <stop offset="100%" stopColor="rgba(148, 163, 184, 0.12)" />
        </radialGradient>

        <mask id={maskId} maskUnits="userSpaceOnUse">
          <rect x={vb} y={vb} width={vbSize} height={vbSize} fill="black" />
          <circle r={R} cx="0" cy="0" fill="white" />
          {isNew && <circle r={R} cx="0" cy="0" fill="black" />}
          {!isNew && !isFull && (
            <>
              <rect
                x={shadowOnLeft ? -R : 0}
                y={-R}
                width={R}
                height={R * 2}
                fill="black"
              />
              {isCrescent && (
                <ellipse cx={0} cy={0} rx={rx} ry={R} fill="black" />
              )}
              {isGibbous && (
                <ellipse cx={0} cy={0} rx={rx} ry={R} fill="white" />
              )}
            </>
          )}
        </mask>
      </defs>

      {instrumentRing && (
        <g aria-hidden="true" opacity={0.85}>
          <circle
            r={R + 14}
            cx="0"
            cy="0"
            fill="none"
            stroke={
              variant === 'aurora'
                ? 'rgba(56, 189, 248, 0.2)'
                : 'rgba(212, 188, 140, 0.35)'
            }
            strokeWidth="0.45"
          />
          <circle
            r={R + 18}
            cx="0"
            cy="0"
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="0.35"
            strokeDasharray="1.2 4"
          />
        </g>
      )}

      <circle r={R} cx="0" cy="0" fill={`url(#${shadowId})`} />

      <g mask={`url(#${maskId})`}>
        <circle r={R} cx="0" cy="0" fill={`url(#${surfaceId})`} />
        {craters.map((c, i) => (
          <ellipse
            key={i}
            cx={c.cx * R}
            cy={c.cy * R}
            rx={c.r * R}
            ry={c.r * R * 0.72}
            fill={
              variant === 'aurora'
                ? `rgba(15, 23, 42, ${c.a})`
                : `rgba(60, 50, 35, ${c.a})`
            }
          />
        ))}
        <circle
          r={R}
          cx="0"
          cy="0"
          fill={`url(#${glowId})`}
          style={{ mixBlendMode: 'screen' }}
        />
      </g>

      {isNew && (
        <circle
          r={R - 0.5}
          cx="0"
          cy="0"
          fill={`url(#${earthId})`}
          opacity={0.9}
        />
      )}

      {!isNew && !isFull && (
        <ellipse
          cx={0}
          cy={0}
          rx={Math.max(rx, 1)}
          ry={R}
          fill="none"
          stroke="rgba(0,0,0,0.2)"
          strokeWidth="0.45"
        />
      )}

      <circle
        r={R + 1.5}
        cx="0"
        cy="0"
        fill="none"
        stroke={
          variant === 'aurora'
            ? 'rgba(125, 211, 252, 0.38)'
            : 'rgba(212, 166, 86, 0.4)'
        }
        strokeWidth="0.55"
      />
    </svg>
  );
}

export const MoonPhaseVisual = memo(MoonPhaseVisualInner);
export default MoonPhaseVisual;
