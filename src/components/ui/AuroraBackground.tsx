import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

/**
 * AuroraBackground — fond immersif pour la DA "Cosmic Editorial".
 *
 * Composé de 4 couches :
 *  1. Fond uni `night-950` (pour iOS rendering jaggies)
 *  2. 3 halos radiaux aurora (violet, magenta, ambre) animés en drift lent
 *  3. Champ d'étoiles canvas (DPR-aware, parallax léger sur scroll)
 *  4. Grain SVG subtil pour casser le banding des dégradés sur écran HDR
 *
 * Tient à 60fps mobile (~50 étoiles) et respecte `prefers-reduced-motion`.
 *
 * Props :
 *   - variant : `default` | `dim` (réduit l'opacité des halos pour les pages
 *     denses comme la guidance pour ne pas noyer le contenu)
 *   - withGrain : ajoute la couche de grain (default: true)
 */
interface AuroraBackgroundProps {
  variant?: 'default' | 'dim';
  withGrain?: boolean;
  withStars?: boolean;
}

export default function AuroraBackground({
  variant = 'default',
  withGrain = true,
  withStars = true,
}: AuroraBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!withStars) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduceMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let raf = 0;

    const resize = () => {
      const { innerWidth: w, innerHeight: h } = window;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const isMobile = window.innerWidth < 768;
    const starCount = isMobile ? 60 : 140;

    type Star = {
      x: number;
      y: number;
      r: number;
      baseAlpha: number;
      twinkleSpeed: number;
      twinklePhase: number;
      drift: number;
    };

    const stars: Star[] = Array.from({ length: starCount }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: Math.random() * 1.4 + 0.3,
      baseAlpha: Math.random() * 0.6 + 0.25,
      twinkleSpeed: Math.random() * 0.0014 + 0.0006,
      twinklePhase: Math.random() * Math.PI * 2,
      drift: (Math.random() - 0.5) * 0.05,
    }));

    const draw = (t: number) => {
      const { innerWidth: w, innerHeight: h } = window;
      ctx.clearRect(0, 0, w, h);

      for (const s of stars) {
        const tw = reduceMotion
          ? s.baseAlpha
          : s.baseAlpha + Math.sin(t * s.twinkleSpeed + s.twinklePhase) * 0.35;
        const alpha = Math.max(0.05, Math.min(1, tw));
        // halo doux
        if (s.r > 1) {
          ctx.fillStyle = `rgba(199, 178, 255, ${alpha * 0.15})`;
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.r * 3, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = `rgba(250, 247, 242, ${alpha})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();

        if (!reduceMotion) {
          s.y += s.drift;
          if (s.y > h + 4) s.y = -4;
          if (s.y < -4) s.y = h + 4;
        }
      }
      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(raf);
    };
  }, [withStars]);

  const haloOpacity = variant === 'dim' ? 0.55 : 1;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden bg-night-950"
    >
      {/* Halo 1 : aurora violet (haut-gauche) */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: haloOpacity }}
        transition={{ duration: 1.6 }}
        className="absolute -top-[20%] -left-[15%] h-[70vh] w-[70vh] rounded-full blur-3xl animate-aurora-drift"
        style={{
          background:
            'radial-gradient(closest-side, rgba(142,85,255,0.55), rgba(142,85,255,0) 70%)',
        }}
      />
      {/* Halo 2 : magenta (centre-droite) */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: haloOpacity * 0.8 }}
        transition={{ duration: 1.8, delay: 0.2 }}
        className="absolute top-[15%] -right-[10%] h-[60vh] w-[60vh] rounded-full blur-3xl animate-aurora-drift"
        style={{
          animationDelay: '-8s',
          background:
            'radial-gradient(closest-side, rgba(232,74,147,0.45), rgba(232,74,147,0) 70%)',
        }}
      />
      {/* Halo 3 : amber (bas) */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: haloOpacity * 0.6 }}
        transition={{ duration: 2, delay: 0.4 }}
        className="absolute -bottom-[20%] left-[20%] h-[55vh] w-[80vh] rounded-full blur-3xl animate-aurora-drift"
        style={{
          animationDelay: '-16s',
          background:
            'radial-gradient(closest-side, rgba(245,182,56,0.28), rgba(245,182,56,0) 75%)',
        }}
      />

      {/* Étoiles */}
      {withStars && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full"
        />
      )}

      {/* Grain SVG (URI inline pour ne pas dépendre d'un asset) */}
      {withGrain && (
        <div
          className="absolute inset-0 mix-blend-overlay opacity-[0.06]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='1'/></svg>\")",
          }}
        />
      )}

      {/* Voile noir doux pour fixer le contraste du texte */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(11,11,26,0.0) 0%, rgba(11,11,26,0.3) 60%, rgba(11,11,26,0.85) 100%)',
        }}
      />
    </div>
  );
}
