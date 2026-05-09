import { useEffect, useRef } from 'react';

interface StarFieldProps {
  /** Densité globale (1 = standard ~250 étoiles, 0.5 = léger, 1.5 = dense). */
  density?: number;
  /** Active la parallaxe au scroll. */
  parallax?: boolean;
  /** Active une nébuleuse dorée diffuse en fond. */
  nebula?: boolean;
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

/**
 * StarField — champ d'étoiles vivant, canvas 2D.
 *
 * Inspiration : CHANI app, Stellarium Web, Sky Tonight. Pas un simple SVG
 * statique : chaque étoile a sa propre fréquence de scintillement, sa
 * magnitude, sa teinte (blanc / or / lavande). 3 couches de parallaxe.
 *
 * Performance : ~250 étoiles, ~60 fps, throttled à 30 fps si onglet
 * en arrière-plan. Utilise `requestAnimationFrame` + `prefers-reduced-motion`.
 */
export default function StarField({
  density = 1,
  parallax = true,
  nebula = true,
  className,
}: StarFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const starsRef = useRef<Star[]>([]);
  const dprRef = useRef<number>(1);
  const sizeRef = useRef<{ w: number; h: number }>({ w: 0, h: 0 });
  const scrollRef = useRef<number>(0);

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
          return `rgba(244, 220, 165, ${alpha})`;
        case 'lavender':
          return `rgba(220, 200, 240, ${alpha})`;
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

    /** Dessine la nébuleuse de fond (or + magenta très diffus). */
    const drawNebula = () => {
      if (!nebula) return;
      const { w, h } = sizeRef.current;

      // Halo or en haut-gauche
      const g1 = ctx.createRadialGradient(
        w * 0.25, h * 0.2, 0,
        w * 0.25, h * 0.2, Math.max(w, h) * 0.7,
      );
      g1.addColorStop(0, 'rgba(212, 166, 86, 0.06)');
      g1.addColorStop(1, 'rgba(212, 166, 86, 0)');
      ctx.fillStyle = g1;
      ctx.fillRect(0, 0, w, h);

      // Halo magenta cosmique en bas-droite (très subtil)
      const g2 = ctx.createRadialGradient(
        w * 0.85, h * 0.85, 0,
        w * 0.85, h * 0.85, Math.max(w, h) * 0.6,
      );
      g2.addColorStop(0, 'rgba(201, 97, 155, 0.04)');
      g2.addColorStop(1, 'rgba(201, 97, 155, 0)');
      ctx.fillStyle = g2;
      ctx.fillRect(0, 0, w, h);
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
      ctx.fillStyle = '#0A0814';
      ctx.fillRect(0, 0, w, h);

      // Nébuleuse de fond
      drawNebula();

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
  }, [density, parallax, nebula]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`pointer-events-none fixed inset-0 z-0 ${className ?? ''}`}
    />
  );
}
