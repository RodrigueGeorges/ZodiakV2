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
  /** Constellations stylisées (12 motifs type zodiaque, traits discrets). */
  constellations?: boolean;
  /** Silhouette de montagnes au premier plan bas. */
  mountains?: boolean;
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
  hue: 'white' | 'gold' | 'frost';
}

const LAYER_PARALLAX = [0.04, 0.12, 0.24] as const;

/**
 * 12 constellations « signes » : polylines en coords normalisées (0–1).
 * Dessin abstrait (pas carte astronomique) — évite surcharge visuelle tout en donnant la lecture « zodiac ».
 */
const ZODIAC_CONSTELLATIONS: readonly (readonly [number, number])[][] = [
  [
    [0.05, 0.09],
    [0.082, 0.14],
    [0.12, 0.11],
    [0.1, 0.06],
  ],
  [[0.88, 0.06], [0.93, 0.11], [0.9, 0.17], [0.85, 0.14]],
  [[0.55, 0.04], [0.6, 0.09], [0.58, 0.14], [0.52, 0.12]],
  [[0.2, 0.28], [0.26, 0.32], [0.31, 0.27], [0.25, 0.22]],
  [[0.72, 0.22], [0.78, 0.26], [0.84, 0.22], [0.8, 0.17]],
  [[0.4, 0.2], [0.45, 0.24], [0.5, 0.2], [0.46, 0.15]],
  [[0.1, 0.42], [0.14, 0.48], [0.09, 0.52], [0.06, 0.46]],
  [[0.9, 0.42], [0.95, 0.48], [0.93, 0.55], [0.86, 0.5]],
  [[0.5, 0.32], [0.54, 0.38], [0.52, 0.44], [0.47, 0.4]],
  [[0.3, 0.58], [0.38, 0.62], [0.45, 0.58], [0.4, 0.52]],
  [[0.6, 0.58], [0.67, 0.64], [0.73, 0.6], [0.68, 0.54]],
  [[0.18, 0.72], [0.26, 0.78], [0.34, 0.74], [0.27, 0.68]],
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
 * Inspiration : ciel atlas + constellations « signes » (stylisation Zodiak).
 * Options `milkyWay`, `mountains`, `constellations` — rendu volontairement sobre (carte d’art).
 */
export default function StarField({
  density = 1,
  parallax = true,
  nebula = true,
  milkyWay = false,
  constellations = false,
  mountains = false,
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
          tintR < 0.88 ? 'white' : tintR < 0.97 ? 'gold' : 'frost';
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
        case 'frost':
          return `rgba(198, 208, 225, ${alpha})`;
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
      // Halo discret — réduit pour éviter effet « néon » sur fond chargé
      if (s.layer === 2 && alpha > 0.55) {
        const haloGrad = ctx.createRadialGradient(
          px, wrappedY, 0,
          px, wrappedY, s.radius * 3.2,
        );
        haloGrad.addColorStop(0, colorFor(s, alpha * 0.4));
        haloGrad.addColorStop(1, colorFor(s, 0));
        ctx.fillStyle = haloGrad;
        ctx.beginPath();
        ctx.arc(px, wrappedY, s.radius * 5, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    /** Voute nocturne — très basse courbe, pas de saturé « démo UI ». */
    const drawNebula = () => {
      if (!nebula) return;
      const { w, h } = sizeRef.current;

      const g1 = ctx.createRadialGradient(
        w * 0.5, -h * 0.06, 0,
        w * 0.5, h * 0.32, Math.max(w, h) * 0.88,
      );
      g1.addColorStop(0, 'rgba(32, 36, 44, 0.09)');
      g1.addColorStop(0.5, 'rgba(18, 18, 22, 0.04)');
      g1.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = g1;
      ctx.fillRect(0, 0, w, h);

      const g2 = ctx.createRadialGradient(
        w * 0.72, h * 0.98, 0,
        w * 0.72, h * 0.98, Math.max(w, h) * 0.55,
      );
      g2.addColorStop(0, 'rgba(90, 71, 46, 0.045)');
      g2.addColorStop(1, 'rgba(90, 71, 46, 0)');
      ctx.fillStyle = g2;
      ctx.fillRect(0, 0, w, h);
    };

    const drawMilkyWay = () => {
      if (!milkyWay) return;
      const { w, h } = sizeRef.current;
      ctx.save();
      ctx.translate(w * 0.48, h * 0.38);
      ctx.rotate(-0.42 * Math.PI);
      const gx = ctx.createRadialGradient(0, 0, 0, 0, 0, Math.max(w, h) * 0.92);
      gx.addColorStop(0, 'rgba(226, 228, 236, 0.045)');
      gx.addColorStop(0.35, 'rgba(110, 118, 140, 0.028)');
      gx.addColorStop(0.65, 'rgba(48, 52, 64, 0.014)');
      gx.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = gx;
      ctx.globalAlpha = 0.62;
      const rw = Math.max(w, h) * 1.85;
      const rh = Math.max(w, h) * 0.17;
      ctx.beginPath();
      ctx.ellipse(0, 0, rw, rh, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    /** Filets constellation : cheveux d’ange, pas de blend « arcade ». */
    const drawConstellationLines = (scrollOffset: number) => {
      if (!constellations) return;
      const { w, h } = sizeRef.current;
      ctx.strokeStyle = 'rgba(212, 206, 194, 0.056)';
      ctx.lineWidth = Math.max(0.35, (dprRef.current || 1) * 0.28);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalCompositeOperation = 'source-over';

      for (const poly of ZODIAC_CONSTELLATIONS) {
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
    };

    /** Nœuds = points de carte (fixes, très discrets). */
    const drawConstellationAnchors = (scrollOffset: number) => {
      if (!constellations) return;
      const { w, h } = sizeRef.current;

      for (const poly of ZODIAC_CONSTELLATIONS) {
        for (const [nx, ny] of poly) {
          const px = nx * w;
          const py = ((ny * h * 1.5) - scrollOffset * 0.06) % (h * 1.5);
          const wy = py < 0 ? py + h * 1.5 : py;
          if (wy < -15 || wy > h + 15) continue;

          const g = ctx.createRadialGradient(px, wy, 0, px, wy, 5);
          g.addColorStop(0, 'rgba(235, 230, 218, 0.22)');
          g.addColorStop(0.45, 'rgba(170, 133, 88, 0.08)');
          g.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(px, wy, 5, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = 'rgba(228, 222, 210, 0.42)';
          ctx.beginPath();
          ctx.arc(px, wy, 0.85, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };

    /** Silhouette montagne — masque bas d’image façon panorama. */
    const drawMountains = () => {
      if (!mountains) return;
      const { w, h } = sizeRef.current;
      const skyline: readonly [number, number][] = [
        [0, 0.035],
        [0.08, 0.085],
        [0.14, 0.052],
        [0.22, 0.078],
        [0.32, 0.048],
        [0.42, 0.072],
        [0.52, 0.042],
        [0.62, 0.075],
        [0.72, 0.055],
        [0.81, 0.082],
        [0.9, 0.058],
        [0.97, 0.078],
        [1, 0.042],
      ];

      ctx.beginPath();
      ctx.moveTo(0, h + 4);
      ctx.lineTo(0, h * (1 - skyline[0]![1]));
      for (let i = 1; i < skyline.length; i++) {
        const [xf, hf] = skyline[i]!;
        ctx.lineTo(xf * w, h * (1 - hf));
      }
      ctx.lineTo(w, h + 4);
      ctx.closePath();

      const mg = ctx.createLinearGradient(0, h * 0.78, 0, h);
      mg.addColorStop(0, 'rgba(2, 2, 3, 0.97)');
      mg.addColorStop(0.5, 'rgba(3, 3, 2, 0.985)');
      mg.addColorStop(1, '#000000');
      ctx.fillStyle = mg;
      ctx.fill();
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
        nextMeteorAtRef.current = timestamp + 9000 + Math.random() * 11000;
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
          len: 64 + Math.random() * 72,
          spd: 9 + Math.random() * 7,
          life: 1,
        });
        nextMeteorAtRef.current =
          timestamp + 15000 + Math.random() * 18000;
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
        g.addColorStop(0, 'rgba(236,228,212,0)');
        g.addColorStop(0.6, `rgba(218,206,182,${0.06 * a})`);
        g.addColorStop(1, `rgba(170,133,88,${0.26 * a})`);

        ctx.strokeStyle = g;
        ctx.lineWidth = 0.85;
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
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, w, h);

      // Nébuleuse de fond
      drawNebula();
      drawMilkyWay();

      const scrollForLines = parallax ? scrollRef.current : 0;
      drawConstellationLines(scrollForLines);
      drawConstellationAnchors(scrollForLines);

      // Étoiles avec twinkle
      const stars = starsRef.current;
      const scroll = parallax ? scrollRef.current : 0;
      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        // Twinkle : alpha oscille autour de baseAlpha
        const t = reduced
          ? s.baseAlpha
          : s.baseAlpha *
            (0.68 + 0.32 * Math.sin(now * s.twinkleFreq + s.twinklePhase));
        const offset = scroll * LAYER_PARALLAX[s.layer];
        drawStar(s, t, offset);
      }

      tickShootingStars(now, reduced);

      drawMountains();

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
    mountains,
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
