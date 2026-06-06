/**
 * Génération d'images Instagram-Story (1080×1920) via Canvas API.
 *
 * Trois templates :
 *   - 'guidance'   : résumé du jour + signature soleil/lune/asc
 *   - 'natal'      : signature complète + glyphes
 *   - 'synastry'   : score + verdict + 2 prénoms
 *
 * Tout est natif (pas de dépendance), branding vide noir + accents or.
 */

export interface StoryGuidanceProps {
  type: 'guidance';
  firstName: string;
  date: string;
  summary: string;
  mantra?: string;
  sunSign?: string;
  moonSign?: string;
  ascSign?: string;
}

export interface StoryNatalProps {
  type: 'natal';
  firstName: string;
  sunSign: string;
  moonSign: string;
  ascSign: string;
}

export interface StorySynastryProps {
  type: 'synastry';
  who1: string;
  who2: string;
  score: number;
  verdict: string;
}

export type StoryProps = StoryGuidanceProps | StoryNatalProps | StorySynastryProps;

const W = 1080;
const H = 1920;

function hex(rgb: [number, number, number], alpha = 1) {
  return `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${alpha})`;
}

function bg(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, W, H);

  // Halos or / bronze très diffus
  const halo = (x: number, y: number, r: number, color: string) => {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, color);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  };
  halo(W * 0.22, H * 0.2, 820, hex([170, 133, 88], 0.32));
  halo(W * 0.82, H * 0.42, 720, hex([90, 71, 46], 0.28));
  halo(W * 0.5, H * 0.9, 900, hex([223, 186, 98], 0.16));

  ctx.fillStyle = 'rgba(0,0,0,0.38)';
  ctx.fillRect(0, H * 0.7, W, H * 0.3);
}

function drawCenteredStars(ctx: CanvasRenderingContext2D, count: number, seed = 1) {
  let s = seed;
  const rng = () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
  ctx.fillStyle = 'rgba(250,247,242,0.6)';
  for (let i = 0; i < count; i++) {
    const x = rng() * W;
    const y = rng() * H;
    const r = rng() * 1.6 + 0.2;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function fontStack(family: 'cinzel' | 'sans' = 'cinzel') {
  return family === 'cinzel'
    ? '"Cinzel", "Times New Roman", serif'
    : '"Inter", system-ui, sans-serif';
}

function drawText(
  ctx: CanvasRenderingContext2D,
  text: string,
  opts: {
    x: number;
    y: number;
    size: number;
    color: string;
    align?: CanvasTextAlign;
    family?: 'cinzel' | 'sans';
    weight?: number;
    maxWidth?: number;
    lineHeight?: number;
    letterSpacing?: number;
  }
): number {
  ctx.fillStyle = opts.color;
  ctx.textAlign = opts.align ?? 'center';
  ctx.textBaseline = 'top';
  ctx.font = `${opts.weight ?? 500} ${opts.size}px ${fontStack(opts.family)}`;

  const max = opts.maxWidth ?? W - 120;
  const lh = opts.lineHeight ?? opts.size * 1.25;

  if (!opts.maxWidth) {
    ctx.fillText(text, opts.x, opts.y);
    return opts.y + lh;
  }

  // Word-wrap simple
  const words = text.split(/\s+/);
  let line = '';
  let cy = opts.y;
  for (const word of words) {
    const test = line ? line + ' ' + word : word;
    if (ctx.measureText(test).width > max && line) {
      ctx.fillText(line, opts.x, cy);
      line = word;
      cy += lh;
    } else {
      line = test;
    }
  }
  if (line) {
    ctx.fillText(line, opts.x, cy);
    cy += lh;
  }
  return cy;
}

function drawWordmark(ctx: CanvasRenderingContext2D, y: number) {
  drawText(ctx, 'ZODIAK', {
    x: W / 2,
    y,
    size: 36,
    color: 'rgba(201,166,255,0.85)',
    family: 'cinzel',
    weight: 600,
  });
  drawText(ctx, 'zodiakastro.com', {
    x: W / 2,
    y: y + 50,
    size: 20,
    color: 'rgba(250,247,242,0.5)',
    family: 'sans',
  });
}

export function renderGuidance(
  canvas: HTMLCanvasElement,
  props: StoryGuidanceProps
) {
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  bg(ctx);
  drawCenteredStars(ctx, 80, 17);

  drawText(ctx, 'GUIDANCE DU JOUR', {
    x: W / 2,
    y: 220,
    size: 28,
    color: 'rgba(201,166,255,0.85)',
    family: 'sans',
    weight: 500,
    letterSpacing: 6,
  });
  drawText(ctx, props.date, {
    x: W / 2,
    y: 270,
    size: 26,
    color: 'rgba(250,247,242,0.55)',
    family: 'sans',
  });

  drawText(ctx, props.firstName, {
    x: W / 2,
    y: 380,
    size: 100,
    color: '#FAF7F2',
    family: 'cinzel',
    weight: 600,
  });

  if (props.sunSign && props.moonSign && props.ascSign) {
    drawText(
      ctx,
      `☉ ${props.sunSign}  ·  ☾ ${props.moonSign}  ·  ↑ ${props.ascSign}`,
      {
        x: W / 2,
        y: 530,
        size: 28,
        color: 'rgba(201,166,255,0.85)',
        family: 'cinzel',
      }
    );
  }

  drawText(ctx, props.summary, {
    x: W / 2,
    y: 700,
    size: 42,
    color: '#FAF7F2',
    family: 'cinzel',
    weight: 500,
    maxWidth: 880,
    lineHeight: 58,
  });

  if (props.mantra) {
    drawText(ctx, '« ' + props.mantra + ' »', {
      x: W / 2,
      y: 1280,
      size: 32,
      color: 'rgba(245,182,56,0.85)',
      family: 'cinzel',
      maxWidth: 800,
      lineHeight: 46,
    });
  }

  drawWordmark(ctx, 1700);
}

export function renderNatal(canvas: HTMLCanvasElement, props: StoryNatalProps) {
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  bg(ctx);
  drawCenteredStars(ctx, 100, 9);

  drawText(ctx, 'MA SIGNATURE ASTRALE', {
    x: W / 2,
    y: 280,
    size: 28,
    color: 'rgba(201,166,255,0.85)',
    family: 'sans',
    letterSpacing: 6,
  });

  drawText(ctx, props.firstName, {
    x: W / 2,
    y: 360,
    size: 100,
    color: '#FAF7F2',
    family: 'cinzel',
    weight: 600,
  });

  const items = [
    { glyph: '☉', label: 'Soleil', value: props.sunSign },
    { glyph: '☾', label: 'Lune', value: props.moonSign },
    { glyph: '↑', label: 'Ascendant', value: props.ascSign },
  ];
  let y = 700;
  for (const it of items) {
    drawText(ctx, it.glyph, {
      x: W / 2,
      y,
      size: 110,
      color: '#aa8558',
      family: 'cinzel',
    });
    drawText(ctx, it.label.toUpperCase(), {
      x: W / 2,
      y: y + 130,
      size: 22,
      color: 'rgba(250,247,242,0.55)',
      family: 'sans',
      letterSpacing: 6,
    });
    drawText(ctx, it.value, {
      x: W / 2,
      y: y + 165,
      size: 50,
      color: '#FAF7F2',
      family: 'cinzel',
      weight: 600,
    });
    y += 320;
  }

  drawWordmark(ctx, 1700);
}

export function renderSynastry(
  canvas: HTMLCanvasElement,
  props: StorySynastryProps
) {
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  bg(ctx);
  drawCenteredStars(ctx, 80, 23);

  drawText(ctx, 'NOTRE SYNASTRIE', {
    x: W / 2,
    y: 240,
    size: 28,
    color: 'rgba(201,166,255,0.85)',
    family: 'sans',
    letterSpacing: 6,
  });

  drawText(ctx, `${props.who1} × ${props.who2}`, {
    x: W / 2,
    y: 320,
    size: 64,
    color: '#FAF7F2',
    family: 'cinzel',
    weight: 600,
  });

  // Score géant
  drawText(ctx, String(props.score), {
    x: W / 2,
    y: 600,
    size: 360,
    color: '#FAF7F2',
    family: 'cinzel',
    weight: 700,
  });
  drawText(ctx, '/ 100', {
    x: W / 2,
    y: 990,
    size: 40,
    color: 'rgba(250,247,242,0.5)',
    family: 'cinzel',
  });

  drawText(ctx, props.verdict, {
    x: W / 2,
    y: 1180,
    size: 42,
    color: 'rgba(201,166,255,0.85)',
    family: 'cinzel',
    maxWidth: 880,
    lineHeight: 58,
  });

  drawWordmark(ctx, 1700);
}

/** Rend le canvas en blob PNG (téléchargement / partage). */
export async function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((b) => resolve(b), 'image/png', 0.96);
  });
}

export function renderStory(canvas: HTMLCanvasElement, props: StoryProps) {
  switch (props.type) {
    case 'guidance':
      return renderGuidance(canvas, props);
    case 'natal':
      return renderNatal(canvas, props);
    case 'synastry':
      return renderSynastry(canvas, props);
  }
}
