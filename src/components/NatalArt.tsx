import { useEffect, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

/**
 * NatalArt — œuvre générative dérivée du thème natal.
 *
 * Concept : la roue zodiacale est belle mais informative. Cette composition
 * est ÉMOTIONNELLE : un mandala unique généré à partir des longitudes
 * planétaires (sans schéma astro identifiable), qui devient une signature
 * visuelle propre à l'utilisateur. Imprimable, partageable, mémorable.
 *
 * Inspiration : mandala génératif sobre (or sur charbon, pas néon).
 *
 * Pas de Three.js — Canvas 2D pur, ~3kB de logique, beau partout.
 *
 * Le canvas se redessine quand `seed` (= longitudes) change.
 */

export interface NatalArtChart {
  // On accepte des longitudes ou un objet astronomy-engine
  longitudes?: number[];
  // Compat : objet `_astroEngine.NatalChart`
  sun?: { longitude: number };
  moon?: { longitude: number };
  mercury?: { longitude: number };
  venus?: { longitude: number };
  mars?: { longitude: number };
  jupiter?: { longitude: number };
  saturn?: { longitude: number };
  ascendant?: { longitude: number };
}

interface NatalArtProps {
  chart: NatalArtChart | null | undefined;
  /** Taille en pixels (carré). */
  size?: number;
  /** Si true, on rend en haute résolution pour export. */
  hd?: boolean;
  /** Étiquette accessible. */
  label?: string;
  className?: string;
}

const PALETTES = [
  ['#aa8558', '#c9619b', '#ead183', '#e8dcc8', '#f4ecdb'],
  ['#8f6f47', '#dfba62', '#fbf3dd', '#5a472e', '#1a1714'],
  ['#c9ae8c', '#aa8558', '#e48bb7', '#d4bc88', '#f4ecdb'],
  ['#5a472e', '#aa8558', '#f4e4b0', '#a89e90', '#080706'],
];

function extractLongs(chart: NatalArtChart): number[] {
  if (chart.longitudes?.length) return chart.longitudes;
  const ks: (keyof NatalArtChart)[] = [
    'sun',
    'moon',
    'mercury',
    'venus',
    'mars',
    'jupiter',
    'saturn',
    'ascendant',
  ];
  return ks
    .map((k) => {
      const v = chart[k];
      return v && typeof v === 'object' && 'longitude' in v ? v.longitude : null;
    })
    .filter((v): v is number => v !== null);
}

function pickPalette(longs: number[]): string[] {
  const sum = longs.reduce((a, b) => a + b, 0);
  return PALETTES[Math.floor(sum / 360) % PALETTES.length];
}

function hash(longs: number[]): number {
  // PRNG seedable simple basé sur les longitudes (hash léger).
  return longs.reduce((acc, v, i) => acc + Math.floor(v * 1000) * (i + 1), 17);
}

function mulberry32(seed: number) {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = t;
    r = Math.imul(r ^ (r >>> 15), r | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function draw(canvas: HTMLCanvasElement, chart: NatalArtChart, hd = false) {
  const longs = extractLongs(chart);
  if (longs.length === 0) return;
  const palette = pickPalette(longs);
  const seed = hash(longs);
  const rng = mulberry32(seed);

  const dpr = hd ? 2 : Math.min(window.devicePixelRatio || 1, 2);
  const sizeCss = canvas.clientWidth || canvas.width;
  const size = sizeCss * dpr;
  if (canvas.width !== size) {
    canvas.width = size;
    canvas.height = size;
  }
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  // Background : gradient radial deep night
  const cx = sizeCss / 2;
  const cy = sizeCss / 2;
  const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, sizeCss * 0.7);
  bg.addColorStop(0, '#13132A');
  bg.addColorStop(1, '#08081A');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, sizeCss, sizeCss);

  // Halos aurora à partir des planètes "rapides" (sun, moon, mercury, venus, mars)
  for (let i = 0; i < Math.min(longs.length, 5); i++) {
    const a = (longs[i] * Math.PI) / 180;
    const r = sizeCss * 0.35;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    const grad = ctx.createRadialGradient(x, y, 0, x, y, sizeCss * 0.4);
    const color = palette[i % palette.length];
    grad.addColorStop(0, withAlpha(color, 0.4));
    grad.addColorStop(1, withAlpha(color, 0));
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, sizeCss, sizeCss);
  }

  // Couches concentriques de "fils cosmiques" : pour chaque planète, on
  // dessine une rosace dont les lobes sont à sa longitude.
  ctx.globalCompositeOperation = 'lighter';
  longs.forEach((long, i) => {
    const lobes = 3 + (i % 5);
    const radiusBase = sizeCss * (0.25 + (i % 4) * 0.05);
    const color = palette[i % palette.length];
    ctx.strokeStyle = withAlpha(color, 0.55);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    const STEPS = 360;
    for (let s = 0; s <= STEPS; s++) {
      const t = (s / STEPS) * Math.PI * 2;
      const wobble = Math.cos(lobes * t + (long * Math.PI) / 180);
      const r = radiusBase * (0.85 + 0.15 * wobble);
      const x = cx + Math.cos(t) * r;
      const y = cy + Math.sin(t) * r;
      if (s === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  });

  // Filaments quasi-aléatoires entre paires de planètes (aspects symboliques)
  ctx.lineWidth = 0.7;
  for (let i = 0; i < longs.length; i++) {
    for (let j = i + 1; j < longs.length; j++) {
      const a = (longs[i] * Math.PI) / 180;
      const b = (longs[j] * Math.PI) / 180;
      const r = sizeCss * 0.32;
      const ax = cx + Math.cos(a) * r;
      const ay = cy + Math.sin(a) * r;
      const bx = cx + Math.cos(b) * r;
      const by = cy + Math.sin(b) * r;
      const grad = ctx.createLinearGradient(ax, ay, bx, by);
      grad.addColorStop(0, withAlpha(palette[i % palette.length], 0.35));
      grad.addColorStop(1, withAlpha(palette[j % palette.length], 0.35));
      ctx.strokeStyle = grad;
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      // Courbe de Bezier qui passe par le centre (style mandala)
      ctx.quadraticCurveTo(cx, cy, bx, by);
      ctx.stroke();
    }
  }

  // Étoiles fines en arrière-plan
  ctx.globalCompositeOperation = 'source-over';
  for (let i = 0; i < 80; i++) {
    const x = rng() * sizeCss;
    const y = rng() * sizeCss;
    const r = rng() * 1.2 + 0.2;
    ctx.fillStyle = withAlpha('#FAF7F2', rng() * 0.5 + 0.2);
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Cœur central : un point lumineux
  const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, sizeCss * 0.06);
  core.addColorStop(0, withAlpha('#FAF7F2', 0.95));
  core.addColorStop(0.4, withAlpha(palette[0], 0.65));
  core.addColorStop(1, withAlpha(palette[0], 0));
  ctx.fillStyle = core;
  ctx.beginPath();
  ctx.arc(cx, cy, sizeCss * 0.08, 0, Math.PI * 2);
  ctx.fill();
}

function withAlpha(hex: string, alpha: number): string {
  // Accepte des #RRGGBB, retourne rgba(r,g,b,a)
  if (hex.startsWith('rgba')) return hex;
  let h = hex.replace('#', '');
  if (h.length === 3) {
    h = h
      .split('')
      .map((c) => c + c)
      .join('');
  }
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export default function NatalArt({
  chart,
  size = 520,
  hd,
  label = 'Œuvre cosmique de ton thème natal',
  className,
}: NatalArtProps) {
  const ref = useRef<HTMLCanvasElement>(null);

  const longs = useMemo(() => (chart ? extractLongs(chart) : []), [chart]);

  useEffect(() => {
    if (!ref.current || !chart || longs.length === 0) return;
    draw(ref.current, chart, hd);
  }, [chart, longs, hd]);

  if (!chart || longs.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'relative inline-block rounded-3xl overflow-hidden bg-night-950',
        'ring-1 ring-aurora-400/25 shadow-glow-aurora',
        className
      )}
      style={{ width: size, height: size, maxWidth: '100%' }}
    >
      <canvas
        ref={ref}
        className="block w-full h-full"
        style={{ width: size, height: size }}
        role="img"
        aria-label={label}
      />
    </motion.div>
  );
}

/**
 * Helper : exporte le canvas natal en PNG haute résolution (1080×1080),
 * pour téléchargement ou intégration dans une story.
 */
export async function exportNatalArtPng(
  chart: NatalArtChart,
  sizePx = 1080
): Promise<Blob | null> {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = sizePx;
  canvas.height = sizePx;
  // On force un clientWidth via inline style pour que `draw` calcule juste.
  canvas.style.width = `${sizePx}px`;
  canvas.style.height = `${sizePx}px`;
  document.body.appendChild(canvas);
  try {
    draw(canvas, chart, true);
    return await new Promise((r) => canvas.toBlob((b) => r(b), 'image/png', 0.95));
  } finally {
    document.body.removeChild(canvas);
  }
}
