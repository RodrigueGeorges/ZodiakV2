import { useEffect, useRef } from 'react';

interface StarFieldProps {
  /** Densité globale (1 = standard ~250 étoiles, 0.5 = léger, 1.5 = dense). */
  density?: number;
  /** Active la parallaxe au scroll. */
  parallax?: boolean;
  /** Active une nébuleuse dorée diffuse en fond. */
  nebula?: boolean;
  /** Bande très diffuse type Voie lactée (landing premium). */
  milkyWay?: boolean;
  /** Constellations abstraites (traits discrets entre repères fictifs). */
  constellations?: boolean;
  /** Étoiles filantes sporadiques (~1 / 6–10 s hors reduced-motion). */
  shootingStars?: boolean;
  className?: string;
}

interface Star {
  x: number;        // position X normalisée (0-1)
  y: number;        // position Y normalisée (0-2 pour couvrir le scroll)
  layer: 0 | 1 | 2; // 0 = lointain, 2 = proche
  radius: number;
  baseAlpha: number;
  twinkleFreq: number;
  twinklePhase: number;
  hue: 'white' | 'gold' | 'lavender';
}

const LAYER_PARALLAX = [0.04, 0.12, 0.24] as const;

/** Polylines en coordonnées normalisées (0–1) — motifs épurés façon carte ancienne. */
const CONSTELLATIONS: readonly (readonly [number, number])[][] = [
  [
    [0.08, 0.12],
    [0.095, 0.17],
    [0.132, 0.22],
    [0.172, 0.28],
    [0.21, 0.34],
  ],
  [
    [0.74, 0.38],
    [0.8, 0.37],
    [0.852, 0.355],
    [0.9, 0.37],
    [0.94, 0.395],
  ],
  [
    [0.42, 0.58],
    [0.458, 0.64],
    [0.5, 0.68],
    [0.55, 0.71],
    [0.6, 0.705],
    [0.65, 0.68],
  ],
];

interface ShootingStarState {
  x: number;
  y: number;
  len: number;
  spd: number;
  /** 1 = nouveau, décroit vers 0 */
  life: number;
}

/**
 * StarField — champ d'étoiles vivant, canvas 2D.
 *
 * Inspiration : CHANI app, Stellarium Web, Sky Tonight. Pas un simple SVG
 * statique : chaque étoile a sa propre fréquence de scintillement, sa
 * magnitude, sa teinte (blanc / or / lavande). 3 couches de parallaxe.
 *
 * Performance : ~250 étoiles, ~60 fps, throttled en arrière-plan. Options
 * `milkyWay`, `constellations`, `shootingStars` pour la landing premium.
 */
export default function StarField({
  density = 1,
  parallax = true,
  nebula = true,
  milkyWay = false,
  constellations = false,
  shootingStars = false,
  className,
}: StarFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const starsRef = useRef<Star[]>([]);
  const dprRef = useRef<number>(1);
  const sizeRef = useRef<{ w: number; h: number }>({ w: 0, h: 0 });
  const scrollRef = useRef<number>(0);
  const meteorsRef = useRef<ShootingStarState[]>([]);
  const nextMeteorAtRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const reduced =
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /** Génère le champ d'étoiles. Position en coordonnées normalisées. */
    const generateStars = () => {
      const totalCount = Math.round(250 * density);
      const stars: Star[] = [];
      for (let i = 0; i < totalCount; i++) {
        // Distribution non-uniforme : plus d'étoiles "lointaines" (layer 0).
        const r = Math.random();
        const layer: 0 | 1 | 2 = r < 0.55 ? 0 : r < 0.85 ? 1 : 2;
        const radius =
          layer === 0
            ? 0.4 + Math.random() * 0.6
            : layer === 1
              ? 0.8 + Math.random() * 0.8
              : 1.2 + Math.random() * 1.4;
        const baseAlpha =
          layer === 0
            ? 0.25 + Math.random() * 0.35
            : layer === 1
              ? 0.45 + Math.random() * 0.4
              : 0.6 + Math.random() * 0.4;
        // Teintes : 75% blanc crème, 18% or pâle, 7% lavande
        const tintR = Math.random();
        const hue: Star['hue'] =
          tintR < 0.75 ? 'white' : tintR < 0.93 ? 'gold' : 'lavender';
        stars.push({
          x: Math.random(),
          y: Math.random() * 2, // 0-2 pour couvrir le scroll
          layer,
          radius,
          baseAlpha,
          twinkleFreq: 0.0006 + Math.random() * 0.0014,
          twinklePhase: Math.random() * Math.PI * 2,
          hue,
        });
      }
      starsRef.current = stars;
    };

    /** Redimensionne le canvas en tenant compte du DPR. */
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      dprRef.current = dpr;
      sizeRef.current = { w, h };
    };

    /** Couleur d'une étoile selon sa teinte. */
    const colorFor = (s: Star, alpha: number) => {
      switch (s.hue) {
        case 'gold':
          return `rgba(200, 190, 155, ${alpha})`;
        case 'lavender':
          return `rgba(175, 185, 205, ${alpha})`;
        default:
          return `rgba(244, 236, 219, ${alpha})`;
      }
    };

    /** Dessine une étoile avec halo subtil pour les magnitudes hautes. */
    const drawStar = (s: Star, alpha: number, scrollOffset: number) => {
      const { w, h } = sizeRef.current;
      const px = s.x * w;
      // y ∈ [0..2], on map sur un viewport étendu (-h .. h*2)
      const py = ((s.y * h * 1.5) - scrollOffset) % (h * 1.5);
      const wrappedY = py < 0 ? py + h * 1.5 : py;
      // Skip si hors écran (perf)
      if (wrappedY < -10 || wrappedY > h + 10) return;

      ctx.fillStyle = colorFor(s, alpha);
      ctx.beginPath();
      ctx.arc(px, wrappedY, s.radius, 0, Math.PI * 2);
      ctx.fill();

      // Halo subtil pour les étoiles brillantes (layer 2)
      if (s.layer === 2 && alpha > 0.55) {
        const haloGrad = ctx.createRadialGradient(
          px, wrappedY, 0,
          px, wrappedY, s.radius * 5,
        );
        haloGrad.addColorStop(0, colorFor(s, alpha * 0.4));
        haloGrad.addColorStop(1, colorFor(s, 0));
        ctx.fillStyle = haloGrad;
        ctx.beginPath();
        ctx.arc(px, wrappedY, s.radius * 5, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    /** Dessine la nébuleuse de fond (signal froid + hint or, sans magenta). */
    const drawNebula = () => {
      if (!nebula) return;
      const { w, h } = sizeRef.current;

      const g1 = ctx.createRadialGradient(
        w * 0.22, h * 0.18, 0,
        w * 0.22, h * 0.18, Math.max(w, h) * 0.72,
      );
      g1.addColorStop(0, 'rgba(127, 160, 144, 0.065)');
      g1.addColorStop(1, 'rgba(127, 160, 144, 0)');
      ctx.fillStyle = g1;
      ctx.fillRect(0, 0, w, h);

      const g2 = ctx.createRadialGradient(
        w * 0.82, h * 0.88, 0,
        w * 0.82, h * 0.88, Math.max(w, h) * 0.55,
      );
      g2.addColorStop(0, 'rgba(212, 166, 86, 0.028)');
      g2.addColorStop(1, 'rgba(212, 166, 86, 0)');
      ctx.fillStyle = g2;
      ctx.fillRect(0, 0, w, h);
    };

    const drawMilkyWay = () => {
      if (!milkyWay) return;
      const { w, h } = sizeRef.current;
      ctx.save();
      ctx.translate(w * 0.52, h * 0.45);
      ctx.rotate(-0.38 * Math.PI);
      const gx = ctx.createRadialGradient(0, 0, 0, 0, 0, Math.max(w, h) * 0.95);
      gx.addColorStop(0, 'rgba(238, 234, 255, 0.14)');
      gx.addColorStop(0.35, 'rgba(200, 195, 230, 0.06)');
      gx.addColorStop(0.7, 'rgba(60, 50, 90, 0.02)');
      gx.addColorStop(1, 'rgba(10, 8, 20, 0)');
      ctx.fillStyle = gx;
      ctx.globalAlpha = 0.85;
      const rw = Math.max(w, h) * 1.85;
      const rh = Math.max(w, h) * 0.22;
      ctx.beginPath();
      ctx.ellipse(0, 0, rw, rh, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    /** Traits entre étoiles “imaginaires”, derrière les points lumineux. */
    const drawConstellationLines = (scrollOffset: number) => {
      if (!constellations) return;
      const { w, h } = sizeRef.current;
      ctx.strokeStyle = 'rgba(212, 166, 86, 0.12)';
      ctx.lineWidth = Math.max(0.45, (dprRef.current || 1) * 0.35);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalCompositeOperation = 'screen';

      for (const poly of CONSTELLATIONS) {
        ctx.beginPath();
        for (let i = 0; i < poly.length; i++) {
          const [nx, ny] = poly[i]!;
          const px = nx * w;
          const py = ((ny * h * 1.5) - scrollOffset * 0.06) % (h * 1.5);
          const wy = py < 0 ? py + h * 1.5 : py;
          if (i === 0) ctx.moveTo(px, wy);
          else ctx.lineTo(px, wy);
        }
        ctx.stroke();
      }

      ctx.globalCompositeOperation = 'source-over';
    };

    /** Mise à jour & dessin des traînées fugaces. */
    const tickShootingStars = (
      timestamp: number,
      reducedStars: boolean,
    ) => {
      if (!shootingStars || reducedStars) {
        meteorsRef.current = [];
        if (!shootingStars) nextMeteorAtRef.current = 0;
        return;
      }
      const { w, h } = sizeRef.current;
      const list = meteorsRef.current;

      if (nextMeteorAtRef.current === 0) {
        nextMeteorAtRef.current = timestamp + 2500 + Math.random() * 4000;
      }

      if (
        list.length === 0 &&
        timestamp >= nextMeteorAtRef.current &&
        !document.hidden
      ) {
        const edge = Math.random();
        let x = 0;
        let y = 0;
        if (edge < 0.5) {
          x = w * (0.55 + Math.random() * 0.45);
          y = -20;
        } else {
          x = w + 20;
          y = h * (0.1 + Math.random() * 0.35);
        }
        list.push({
          x,
          y,
          len: 80 + Math.random() * 90,
          spd: 12 + Math.random() * 10,
          life: 1,
        });
        nextMeteorAtRef.current =
          timestamp + 6000 + Math.random() * 7000;
      }

      for (let i = list.length - 1; i >= 0; i--) {
        const m = list[i]!;
        m.x -= m.spd * 0.75;
        m.y += m.spd * 0.45;
        m.life -= 0.022;

        if (m.life <= 0 || m.x < -100 || m.y > h + 100) {
          list.splice(i, 1);
          continue;
        }

        const headX = m.x;
        const headY = m.y;
        const ang = Math.atan2(m.spd * 0.45, -m.spd * 0.75);
        const tailX = headX + Math.cos(ang + Math.PI) * m.len * m.life;
        const tailY = headY + Math.sin(ang + Math.PI) * m.len * m.life;

        const g = ctx.createLinearGradient(tailX, tailY, headX, headY);
        const a = Math.max(0, m.life);
        g.addColorStop(0, `rgba(244,236,219,0)`);
        g.addColorStop(0.55, `rgba(244,228,205,${0.12 * a})`);
        g.addColorStop(1, `rgba(212,166,86,${0.55 * a})`);

        ctx.strokeStyle = g;
        ctx.lineWidth = 1.35;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(headX, headY);
        ctx.stroke();
      }
    };

    /** Boucle de rendu. */
    let lastTime = 0;
    const loop = (now: number) => {
      const { w, h } = sizeRef.current;

      // Throttle à 30fps en arrière-plan ; 60fps actif
      const elapsed = now - lastTime;
      const targetFrame = document.hidden ? 33 : 16;
      if (elapsed < targetFrame) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }
      lastTime = now;

      // Clear avec encre profonde (au lieu de transparent : évite le scintillement)
      ctx.fillStyle = '#07090D';
      ctx.fillRect(0, 0, w, h);

      // Nébuleuse de fond
      drawNebula();
      drawMilkyWay();

      const scrollForLines = parallax ? scrollRef.current : 0;
      drawConstellationLines(scrollForLines);

      // Étoiles avec twinkle
      const stars = starsRef.current;
      const scroll = parallax ? scrollRef.current : 0;
      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        // Twinkle : alpha oscille autour de baseAlpha
        const t = reduced
          ? s.baseAlpha
          : s.baseAlpha *
            (0.55 + 0.45 * Math.sin(now * s.twinkleFreq + s.twinklePhase));
        const offset = scroll * LAYER_PARALLAX[s.layer];
        drawStar(s, t, offset);
      }

      tickShootingStars(now, reduced);

      rafRef.current = requestAnimationFrame(loop);
    };

    const onScroll = () => {
      scrollRef.current = window.scrollY;
    };

    resize();
    generateStars();
    rafRef.current = requestAnimationFrame(loop);

    window.addEventListener('resize', resize);
    if (parallax) window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
      window.removeEventListener('scroll', onScroll);
    };
  }, [
    density,
    parallax,
    nebula,
    milkyWay,
    constellations,
    shootingStars,
  ]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`pointer-events-none fixed inset-0 z-0 ${className ?? ''}`}
    />
  );
}
