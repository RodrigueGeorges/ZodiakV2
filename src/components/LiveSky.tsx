import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { moonPhaseAt } from '../lib/moonPhase';
import { cn } from '../lib/utils';

interface LiveSkyProps {
  className?: string;
  /** Date de référence (par défaut : maintenant). Utile pour démos / tests. */
  date?: Date;
  /** Affiche la couronne ornementale autour de la lune (par défaut: true). */
  ornate?: boolean;
}

/**
 * LiveSky — scène astronomique SVG de la landing.
 *
 * Remplace une maquette statique par une lune rendue avec phase réelle :
 * terminator exact, cratères en gravure stylisée, couronne ornementale type
 * planche d’astronomie 19ᵉ, et légende manuscrite Fraunces.
 *
 * Direction artistique :
 *   - Sphère lunaire en SVG : surface texturée + cratères ellipsoïdes,
 *     terminator géré par un masque elliptique pour reproduire la phase
 *     réelle (croissant à pleine en passant par les quartiers).
 *   - Couronne ornementale (anneau gradué + 12 graduations or à 30°).
 *   - Légende Fraunces : phase actuelle + % illumination + date.
 *   - Animation : très lente respiration (8s) façon astre.
 *
 * Performance : pur SVG (zéro canvas ici, c'est statique sauf respiration).
 */
export default function LiveSky({
  className,
  date,
  ornate = true,
}: LiveSkyProps) {
  const reduced = useReducedMotion();
  const [now, setNow] = useState(() => date ?? new Date());

  // Refresh toutes les 60s pour que la lune et la légende restent vivantes.
  useEffect(() => {
    if (date) return;
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, [date]);

  const phase = useMemo(() => moonPhaseAt(now), [now]);
  const illumPct = Math.round(phase.illumination * 100);
  const dateLabel = useMemo(
    () =>
      now.toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      }),
    [now],
  );

  return (
    <motion.figure
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1.2, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'relative w-full max-w-[440px] mx-auto select-none',
        className,
      )}
      aria-label={`La Lune ce soir : ${phase.label}, ${illumPct}% d'illumination`}
    >
      {/* Halo or alchimique très subtil derrière la scène */}
      <div
        aria-hidden="true"
        className="absolute -inset-12 rounded-full bg-aurora-400/[0.08] blur-3xl pointer-events-none"
      />

      <motion.div
        aria-hidden="true"
        animate={
          reduced
            ? undefined
            : {
                scale: [1, 1.012, 1],
              }
        }
        transition={
          reduced
            ? undefined
            : { duration: 8, repeat: Infinity, ease: 'easeInOut' }
        }
        className="relative aspect-square w-full"
      >
        <MoonSvg phase={phase} ornate={ornate} />
      </motion.div>

      {/* Légende Fraunces — manuscrit enluminé */}
      <figcaption className="relative mt-7 md:mt-8 text-center">
        <p className="eyebrow-ritual text-aurora-400/90 mb-2.5 flex items-center justify-center gap-3">
          <span aria-hidden="true" className="block h-px w-7 bg-aurora-400/50" />
          <span>La Lune ce soir</span>
          <span aria-hidden="true" className="block h-px w-7 bg-aurora-400/50" />
        </p>
        <p className="font-display font-light italic-editorial text-h2 text-ivory-50 leading-tight">
          {phase.label}
        </p>
        <p className="mt-2 text-caption text-ivory-300/70 small-caps">
          {illumPct}% &middot; {dateLabel}
        </p>
      </figcaption>
    </motion.figure>
  );
}

/* ──────────────────────────────────────────────────────────────────────── */
/*  Moon SVG — sphère + cratères + terminator                              */
/* ──────────────────────────────────────────────────────────────────────── */

interface MoonSvgProps {
  phase: ReturnType<typeof moonPhaseAt>;
  ornate: boolean;
}

function MoonSvg({ phase, ornate }: MoonSvgProps) {
  const { illumination, kind } = phase;

  /*
   * Calcul du terminator (frontière ombre / lumière).
   *
   * Modèle géométrique : la frontière est une demi-ellipse verticale
   * centrée sur l'axe du disque (cx = 0), de demi-grand axe horizontal
   * `rx = R · |cos(φ)|` où φ = π · (1 − illumination) est l'angle de phase.
   *
   *   - Nouvelle  (p = 0)   : φ = π,    rx = R   → tout est sombre
   *   - Quartier  (p = 0.5) : φ = π/2,  rx = 0   → moitié sombre (terminator vertical)
   *   - Pleine    (p = 1)   : φ = 0,    rx = R   → tout est éclairé
   *
   * Côté éclairé :
   *   - Phases croissantes (waxing) : éclairé à droite, ombre à gauche
   *   - Phases décroissantes (waning) : éclairé à gauche, ombre à droite
   *
   * Construction du masque (visible = blanc) :
   *   1. Disque entier blanc
   *   2. Demi-disque sombre (rect)
   *   3. Si croissant (illum < 0.5)  : on AJOUTE de l'ombre via une
   *      ellipse noire centrée à 0 (mord dans la moitié éclairée pour
   *      laisser un fin croissant)
   *      Si gibbeuse (illum > 0.5) : on RETIRE de l'ombre via une
   *      ellipse blanche centrée à 0 (mord dans la moitié sombre)
   */
  const R = 100;
  const isWaning = kind.startsWith('waning') || kind === 'last_quarter';
  const phaseAngle = Math.PI * (1 - illumination);
  const rx = Math.abs(Math.cos(phaseAngle)) * R;
  const isNew = kind === 'new' || illumination < 0.02;
  const isFull = kind === 'full' || illumination > 0.98;
  const isCrescent = !isNew && !isFull && illumination < 0.5;
  const isGibbous = !isNew && !isFull && illumination > 0.5;
  const shadowOnLeft = !isWaning && !isNew;

  // Cratères stylisés (positions normalisées dans [-1, 1] × [-1, 1])
  const craters: Array<{ cx: number; cy: number; r: number; alpha: number }> = [
    { cx: -0.18, cy: -0.32, r: 0.14, alpha: 0.18 }, // mer de la Sérénité
    { cx: 0.22, cy: -0.18, r: 0.18, alpha: 0.22 },  // mer de la Tranquillité
    { cx: -0.12, cy: 0.28, r: 0.22, alpha: 0.20 },  // mer des Pluies
    { cx: 0.32, cy: 0.42, r: 0.10, alpha: 0.16 },   // mer du Nectar
    { cx: -0.42, cy: -0.05, r: 0.07, alpha: 0.14 }, // Copernic
    { cx: 0.05, cy: 0.55, r: 0.08, alpha: 0.13 },   // Tycho
    { cx: -0.5, cy: 0.4, r: 0.06, alpha: 0.10 },
    { cx: 0.4, cy: -0.45, r: 0.05, alpha: 0.10 },
  ];

  return (
    <svg
      viewBox="-150 -150 300 300"
      className="absolute inset-0 w-full h-full"
      role="img"
    >
      <defs>
        {/* Gradient de surface lunaire : pas un blanc plat, mais un
            crème avec léger éclairage rasant et terminator doux. */}
        <radialGradient id="moonSurface" cx="35%" cy="30%" r="80%">
          <stop offset="0%"  stopColor="#FFF7E5" />
          <stop offset="35%" stopColor="#F4E5C2" />
          <stop offset="70%" stopColor="#D4BC88" />
          <stop offset="100%" stopColor="#8A7654" />
        </radialGradient>

        {/* Glow externe */}
        <radialGradient id="moonGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%"  stopColor="rgba(244,236,219,0.0)" />
          <stop offset="60%" stopColor="rgba(244,236,219,0.0)" />
          <stop offset="100%" stopColor="rgba(170,133,88,0.38)" />
        </radialGradient>

        {/* Gradient pour la zone sombre (côté terre noir) */}
        <radialGradient id="moonShadow" cx="50%" cy="50%" r="55%">
          <stop offset="0%" stopColor="#141210" />
          <stop offset="100%" stopColor="#050505" />
        </radialGradient>

        {/* Mask de la phase :
            - blanc = visible (éclairé)
            - noir  = invisible (ombre) */}
        <mask id="phaseMask" maskUnits="userSpaceOnUse">
          <rect x="-150" y="-150" width="300" height="300" fill="black" />
          <circle r={R} cx="0" cy="0" fill="white" />
          {isNew && (
            <circle r={R} cx="0" cy="0" fill="black" />
          )}
          {!isNew && !isFull && (
            <>
              {/* Demi-disque sombre */}
              <rect
                x={shadowOnLeft ? -R : 0}
                y={-R}
                width={R}
                height={R * 2}
                fill="black"
              />
              {/* Ellipse correctrice : ajoute ou retire selon la phase */}
              {isCrescent && (
                <ellipse
                  cx={0}
                  cy={0}
                  rx={rx}
                  ry={R}
                  fill="black"
                />
              )}
              {isGibbous && (
                <ellipse
                  cx={0}
                  cy={0}
                  rx={rx}
                  ry={R}
                  fill="white"
                />
              )}
            </>
          )}
        </mask>

        {/* Texture grain subtil */}
        <filter id="moonGrain" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="1.8"
            numOctaves="2"
            seed="7"
          />
          <feColorMatrix values="0 0 0 0 0.85   0 0 0 0 0.78   0 0 0 0 0.6   0 0 0 0.05 0" />
          <feComposite in2="SourceGraphic" operator="in" />
        </filter>
      </defs>

      {/* Couronne ornementale : anneau gradué style planche astronomique */}
      {ornate && <OrnateRing radius={R} />}

      {/* Disque sombre (face cachée) — visible quand l'ombre couvre */}
      <circle r={R} cx="0" cy="0" fill="url(#moonShadow)" />

      {/* Surface lunaire éclairée (clippée par phaseMask) */}
      <g mask="url(#phaseMask)">
        <circle r={R} cx="0" cy="0" fill="url(#moonSurface)" />

        {/* Cratères / mers — ellipses légèrement aplaties */}
        {craters.map((c, i) => (
          <ellipse
            key={i}
            cx={c.cx * R}
            cy={c.cy * R}
            rx={c.r * R}
            ry={c.r * R * (0.7 + (i % 3) * 0.12)}
            fill={`rgba(60, 50, 35, ${c.alpha})`}
          />
        ))}

        {/* Halo lumineux côté éclairé */}
        <circle
          r={R}
          cx="0"
          cy="0"
          fill="url(#moonGlow)"
          style={{ mixBlendMode: 'screen' }}
        />
      </g>

      {/* Terminator doux : trait subtil sur la frontière du croissant/gibbeux */}
      {!isNew && !isFull && (
        <ellipse
          cx={0}
          cy={0}
          rx={Math.max(rx, 1)}
          ry={R}
          fill="none"
          stroke="rgba(0,0,0,0.18)"
          strokeWidth="0.5"
        />
      )}

      {/* Glow externe doré, mode screen pour ne pas obscurcir */}
      <circle
        r={R + 2}
        cx="0"
        cy="0"
        fill="none"
        stroke="rgba(212, 166, 86, 0.35)"
        strokeWidth="0.8"
      />
    </svg>
  );
}

/* ──────────────────────────────────────────────────────────────────────── */
/*  Couronne ornementale — anneau gradué façon planche d'astronomie         */
/* ──────────────────────────────────────────────────────────────────────── */

function OrnateRing({ radius }: { radius: number }) {
  const ringR = radius + 18;
  const tickR = radius + 24;
  const labelR = radius + 32;

  // Glyphes du zodiaque (Unicode) sur 12 positions à 30°.
  // Position 0 = haut (Bélier), sens horaire.
  const glyphs = [
    '♈', '♉', '♊', '♋', '♌', '♍',
    '♎', '♏', '♐', '♑', '♒', '♓',
  ];

  return (
    <g aria-hidden="true">
      {/* Anneau extérieur (filet or) */}
      <circle
        cx="0"
        cy="0"
        r={ringR}
        fill="none"
        stroke="rgba(212, 166, 86, 0.28)"
        strokeWidth="0.6"
      />
      {/* Anneau secondaire ultra-fin */}
      <circle
        cx="0"
        cy="0"
        r={ringR + 6}
        fill="none"
        stroke="rgba(212, 166, 86, 0.12)"
        strokeWidth="0.4"
        strokeDasharray="1 3"
      />

      {/* 12 graduations majeures avec glyphes zodiacaux */}
      {glyphs.map((g, i) => {
        const angle = (i / 12) * Math.PI * 2 - Math.PI / 2; // commence en haut
        const x1 = Math.cos(angle) * ringR;
        const y1 = Math.sin(angle) * ringR;
        const x2 = Math.cos(angle) * tickR;
        const y2 = Math.sin(angle) * tickR;
        const lx = Math.cos(angle) * labelR;
        const ly = Math.sin(angle) * labelR;
        return (
          <g key={i}>
            <line
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="rgba(212, 166, 86, 0.6)"
              strokeWidth="0.8"
              strokeLinecap="round"
            />
            <text
              x={lx}
              y={ly}
              fontSize="9"
              fill="rgba(212, 166, 86, 0.7)"
              textAnchor="middle"
              dominantBaseline="middle"
              fontFamily="serif"
            >
              {g}
            </text>
          </g>
        );
      })}

      {/* 60 micro-graduations */}
      {Array.from({ length: 60 }).map((_, i) => {
        if (i % 5 === 0) return null;
        const angle = (i / 60) * Math.PI * 2 - Math.PI / 2;
        const x1 = Math.cos(angle) * ringR;
        const y1 = Math.sin(angle) * ringR;
        const x2 = Math.cos(angle) * (ringR + 2.5);
        const y2 = Math.sin(angle) * (ringR + 2.5);
        return (
          <line
            key={`m${i}`}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="rgba(212, 166, 86, 0.25)"
            strokeWidth="0.4"
          />
        );
      })}
    </g>
  );
}
