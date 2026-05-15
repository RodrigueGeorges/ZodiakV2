import { useEffect, useRef } from 'react';

interface StarFieldProps {
  /** Densité globale (1 = standard ~250 étoiles, 0.5 = léger, 1.5 = dense). */
  density?: number;
  /** Teinte globale (mode « Effet couleur » : halo froid prononcé sur le résultat). */
  chromaBoost?: boolean;
  /** Active la parallaxe au scroll. */
  parallax?: boolean;
  /** Active une brume diffuse froide après le fond. */
  nebula?: boolean;
  /** @deprecated Ancienne « Voie lactée » (ellipse) — retirée : bande horizontale trop visible. Gardé pour compat API. */
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
 * Options `mountains`, `constellations` — rendu volontairement sobre (carte d’art).
 * La prop `milkyWay` est ignorée (ancienne ellipse retirée).
 */
export default function StarField({
  density = 1,
  parallax = true,
  nebula = true,
  milkyWay: _milkyWay = false,
  constellations = false,
  mountains = false,
  shootingStars = false,
  chromaBoost = false,
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
          tintR < 0.72 ? 'white' : tintR < 0.9 ? 'frost' : 'gold';
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
          return `rgba(186, 210, 245, ${alpha})`;
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

    /** Halo bleu léger après le fond (option `nebula`). */
    const drawNebula = () => {
      if (!nebula) return;
      const { w, h } = sizeRef.current;

      const g1 = ctx.createRadialGradient(
        w * 0.12, -h * 0.02, 0,
        w * 0.12, h * 0.42, Math.max(w, h) * 0.72,
      );
      g1.addColorStop(0, 'rgba(40, 90, 160, 0.07)');
      g1.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = g1;
      ctx.fillRect(0, 0, w, h);

      const g2 = ctx.createRadialGradient(
        w * 0.88, h * 0.92, 0,
        w * 0.88, h * 0.92, Math.max(w, h) * 0.52,
      );
      g2.addColorStop(0, 'rgba(30, 55, 100, 0.08)');
      g2.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = g2;
      ctx.fillRect(0, 0, w, h);
    };

    /** Halos discrets au barycentre de chaque motif zodiaque (pas de bande horizontale). */
    const drawZodiacAmbience = () => {
      if (!constellations) return;
      const { w, h } = sizeRef.current;
      const R = Math.max(w, h);
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      for (const poly of ZODIAC_CONSTELLATIONS) {
        let sx = 0;
        let sy = 0;
        for (const [nx, ny] of poly) {
          sx += nx;
          sy += ny;
        }
        sx /= poly.length;
        sy /= poly.length;
        const px = sx * w;
        const py = sy * h;
        const rr = R * (chromaBoost ? 0.19 : 0.15);
        const a0 = chromaBoost ? 0.065 : 0.04;
        const g = ctx.createRadialGradient(px, py, 0, px, py, rr);
        g.addColorStop(0, `rgba(72, 155, 215, ${a0})`);
        g.addColorStop(0.5, `rgba(38, 88, 145, ${a0 * 0.4})`);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
      }
      ctx.restore();
    };

    /** Filets constellation : bleu très pâle, lisibles sur ciel atlas.
     *  Animation subtile : opacité pulsante + dash-offset décalé pour effet "signal".
     */
    const drawConstellationLines = (scrollOffset: number, time: number) => {
      if (!constellations) return;
      const { w, h } = sizeRef.current;
      const baseAlpha = chromaBoost ? 0.17 : 0.12;
      const pulse = 0.08 * Math.sin(time * 0.0008);
      ctx.strokeStyle = chromaBoost
        ? `rgba(172, 210, 255, ${baseAlpha + pulse})`
        : `rgba(150, 200, 255, ${baseAlpha + pulse})`;
      ctx.lineWidth = Math.max(0.45, (dprRef.current || 1) * 0.36);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalCompositeOperation = 'source-over';

      for (let p = 0; p < ZODIAC_CONSTELLATIONS.length; p++) {
        const poly = ZODIAC_CONSTELLATIONS[p]!;
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

    /** Nœuds = points de carte avec pulse dynamique. */
    const drawConstellationAnchors = (scrollOffset: number, time: number) => {
      if (!constellations) return;
      const { w, h } = sizeRef.current;

      for (let p = 0; p < ZODIAC_CONSTELLATIONS.length; p++) {
        const poly = ZODIAC_CONSTELLATIONS[p]!;
        const nodePulse = 0.22 + 0.18 * Math.sin(time * 0.0012 + p * 1.1);
        for (const [nx, ny] of poly) {
          const px = nx * w;
          const py = ((ny * h * 1.5) - scrollOffset * 0.06) % (h * 1.5);
          const wy = py < 0 ? py + h * 1.5 : py;
          if (wy < -15 || wy > h + 15) continue;

          const g = ctx.createRadialGradient(px, wy, 0, px, wy, 6);
          g.addColorStop(0, `rgba(200, 230, 255, ${nodePulse})`);
          g.addColorStop(0.45, `rgba(120, 180, 235, ${nodePulse * 0.4})`);
          g.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(px, wy, 6, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = `rgba(220, 235, 255, ${0.45 + nodePulse * 0.5})`;
          ctx.beginPath();
          ctx.arc(px, wy, 1.1, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };

    /** Silhouettes montagne superposées (profondeur, comme références « atlas »). */
    const drawMountains = () => {
      if (!mountains) return;
      const { w, h } = sizeRef.current;

      const trace = (pts: readonly [number, number][]) => {
        ctx.beginPath();
        ctx.moveTo(0, h + 4);
        ctx.lineTo(0, h * (1 - pts[0]![1]));
        for (let i = 1; i < pts.length; i++) {
          const [xf, ht] = pts[i]!;
          ctx.lineTo(xf * w, h * (1 - ht));
        }
        ctx.lineTo(w, h + 4);
      };

      const back: readonly [number, number][] = [
        [0, 0.02],
        [0.1, 0.055],
        [0.2, 0.032],
        [0.34, 0.05],
        [0.48, 0.028],
        [0.62, 0.046],
        [0.76, 0.034],
        [0.88, 0.05],
        [1, 0.032],
      ];
      trace(back);
      const backGrad = ctx.createLinearGradient(0, h * 0.82, 0, h);
      backGrad.addColorStop(0, 'rgba(22, 40, 68, 0.55)');
      backGrad.addColorStop(1, 'rgba(8, 14, 28, 0.75)');
      ctx.fillStyle = backGrad;
      ctx.fill();

      const mid: readonly [number, number][] = [
        [0, 0.032],
        [0.06, 0.078],
        [0.15, 0.048],
        [0.25, 0.072],
        [0.36, 0.042],
        [0.46, 0.068],
        [0.55, 0.038],
        [0.64, 0.07],
        [0.74, 0.05],
        [0.82, 0.078],
        [0.92, 0.055],
        [1, 0.045],
      ];
      trace(mid);
      const midGrad = ctx.createLinearGradient(0, h * 0.86, 0, h);
      midGrad.addColorStop(0, 'rgba(6, 10, 20, 0.88)');
      midGrad.addColorStop(1, 'rgba(2, 3, 6, 0.94)');
      ctx.fillStyle = midGrad;
      ctx.fill();

      const front: readonly [number, number][] = [
        [0, 0.036],
        [0.08, 0.09],
        [0.14, 0.055],
        [0.22, 0.082],
        [0.32, 0.049],
        [0.42, 0.075],
        [0.52, 0.045],
        [0.62, 0.078],
        [0.72, 0.058],
        [0.81, 0.086],
        [0.9, 0.061],
        [0.97, 0.082],
        [1, 0.048],
      ];
      trace(front);
      const mg = ctx.createLinearGradient(0, h * 0.74, 0, h);
      mg.addColorStop(0, 'rgba(0, 2, 6, 0.97)');
      mg.addColorStop(0.55, 'rgba(0, 0, 0, 0.99)');
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

      // Fond nuit uniforme (évite bande type « horizon » en bas)
      const sky = ctx.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, '#010102');
      sky.addColorStop(0.3, '#040810');
      sky.addColorStop(0.55, '#061018');
      sky.addColorStop(0.82, chromaBoost ? '#0a1830' : '#060d1a');
      sky.addColorStop(1, chromaBoost ? '#0c1a32' : '#04080f');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h);

      drawNebula();
      drawZodiacAmbience();

      const scrollForLines = parallax ? scrollRef.current : 0;
      drawConstellationLines(scrollForLines, now);
      drawConstellationAnchors(scrollForLines, now);

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

      if (chromaBoost) {
        ctx.save();
        const wash = ctx.createRadialGradient(
          w * 0.5,
          h * 0.45,
          0,
          w * 0.5,
          h * 0.45,
          Math.max(w, h) * 0.72,
        );
        wash.addColorStop(0, 'rgba(40, 120, 200, 0.12)');
        wash.addColorStop(0.5, 'rgba(20, 60, 110, 0.06)');
        wash.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = wash;
        ctx.globalCompositeOperation = 'screen';
        ctx.fillRect(0, 0, w, h);
        ctx.restore();
      }

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
    constellations,
    mountains,
    shootingStars,
    chromaBoost,
  ]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`pointer-events-none fixed inset-0 z-0 ${className ?? ''}`}
    />
  );
}
