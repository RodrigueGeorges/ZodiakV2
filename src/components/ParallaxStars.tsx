import { useMemo } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';

interface ParallaxStarsProps {
  className?: string;
  /** Densité (nb d'étoiles par couche). */
  density?: number;
}

interface StarLayer {
  count: number;
  size: [number, number];
  opacity: [number, number];
  twinkleSpeed: [number, number];
  parallaxSpeed: number;
}

/**
 * Étoiles d'arrière-plan multi-couches avec parallaxe au scroll.
 *
 * 3 couches de profondeur :
 *  - Background : grosses étoiles flou, scroll lent (impression de lointain)
 *  - Mid : taille moyenne, scroll moyen
 *  - Foreground : petites étoiles nettes, scroll rapide (proche)
 *
 * Chaque étoile clignote indépendamment. Position calculée une fois (useMemo)
 * pour ne pas se ré-randomiser à chaque render.
 *
 * Performance : tout en SVG inline, pas de canvas, pas de WebGL. Trois <svg>
 * indépendants pour pouvoir leur appliquer un Y transform parallax distinct.
 */
export default function ParallaxStars({
  className,
  density = 1,
}: ParallaxStarsProps) {
  const reduced = useReducedMotion();
  const { scrollY } = useScroll();

  const layers: StarLayer[] = [
    {
      count: Math.round(40 * density),
      size: [0.5, 1.4],
      opacity: [0.15, 0.45],
      twinkleSpeed: [4, 7],
      parallaxSpeed: 0.05,
    },
    {
      count: Math.round(30 * density),
      size: [0.8, 1.8],
      opacity: [0.3, 0.7],
      twinkleSpeed: [3, 5],
      parallaxSpeed: 0.15,
    },
    {
      count: Math.round(18 * density),
      size: [1.2, 2.4],
      opacity: [0.5, 1],
      twinkleSpeed: [2.5, 4],
      parallaxSpeed: 0.3,
    },
  ];

  // Précalcule les positions une seule fois
  const layerStars = useMemo(
    () =>
      layers.map((layer) =>
        Array.from({ length: layer.count }).map((_, i) => ({
          x: Math.random() * 100,
          y: Math.random() * 200, // 0–200 % pour couvrir le scroll
          r:
            layer.size[0] +
            Math.random() * (layer.size[1] - layer.size[0]),
          opacity:
            layer.opacity[0] +
            Math.random() * (layer.opacity[1] - layer.opacity[0]),
          twinkle:
            layer.twinkleSpeed[0] +
            Math.random() * (layer.twinkleSpeed[1] - layer.twinkleSpeed[0]),
          delay: Math.random() * 5,
          key: `${layer.count}-${i}`,
        })),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [density],
  );

  // Hooks au top level (pas dans .map())
  const y0 = useTransform(scrollY, (v) => -v * layers[0].parallaxSpeed);
  const y1 = useTransform(scrollY, (v) => -v * layers[1].parallaxSpeed);
  const y2 = useTransform(scrollY, (v) => -v * layers[2].parallaxSpeed);
  const ys = [y0, y1, y2];

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className ?? ''}`}
    >
      {layers.map((_, idx) => (
        <motion.svg
          key={idx}
          viewBox="0 0 100 200"
          preserveAspectRatio="none"
          className="absolute inset-0 w-full h-[200%]"
          style={reduced ? undefined : { y: ys[idx] }}
        >
          {layerStars[idx].map((s) => (
            <motion.circle
              key={s.key}
              cx={s.x}
              cy={s.y}
              r={s.r}
              fill="rgba(250,247,242,1)"
              initial={{ opacity: s.opacity }}
              animate={
                reduced
                  ? undefined
                  : {
                      opacity: [
                        s.opacity * 0.4,
                        s.opacity,
                        s.opacity * 0.4,
                      ],
                    }
              }
              transition={
                reduced
                  ? undefined
                  : {
                      duration: s.twinkle,
                      repeat: Infinity,
                      delay: s.delay,
                      ease: 'easeInOut',
                    }
              }
            />
          ))}
        </motion.svg>
      ))}
    </div>
  );
}
