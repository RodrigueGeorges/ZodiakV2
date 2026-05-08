import { useEffect, useRef } from 'react';

/**
 * AuroraShader — fragment shader WebGL plein-écran (un seul plan).
 *
 * Pas de Three.js. Juste WebGL natif :
 *   - 1 vertex shader trivial (un quad full-screen)
 *   - 1 fragment shader procédural qui simule des nappes aurora animées,
 *     avec 3 sphères de lumière qui dérivent + un noise lent qui ondule
 *
 * Coût : ~3kB brut, ~30 FPS sur mobile bas de gamme, 60 FPS partout ailleurs.
 * Respecte `prefers-reduced-motion` (fallback statique).
 *
 * Usage : Hero landing uniquement. Pour les pages de l'app, on garde
 * `AuroraBackground` (CSS pur, plus léger).
 */

const VERT = `#version 300 es
in vec2 a_position;
out vec2 v_uv;
void main() {
  v_uv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const FRAG = `#version 300 es
precision highp float;
in vec2 v_uv;
out vec4 fragColor;
uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_mouse;

// Noise simplexe 2D (Ashima)
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec2 mod289(vec2 x){return x-floor(x*(1.0/289.0))*289.0;}
vec3 permute(vec3 x){return mod289(((x*34.0)+1.0)*x);}
float snoise(vec2 v){
  const vec4 C = vec4(0.211324865, 0.366025403, -0.577350269, 0.024390243);
  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod289(i);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m*m; m = m*m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291 - 0.85373472 * (a0*a0 + h*h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

vec3 halo(vec2 uv, vec2 c, float r, vec3 col, float intensity){
  float d = distance(uv, c);
  float a = exp(-d*d/(r*r)) * intensity;
  return col * a;
}

void main(){
  vec2 uv = v_uv;
  vec2 aspect = vec2(u_resolution.x / u_resolution.y, 1.0);
  vec2 puv = (uv - 0.5) * aspect;

  // Aurora "nappes" — somme de noise sur 2 octaves, animée
  float t = u_time * 0.06;
  float n1 = snoise(puv * 1.6 + vec2(t, t * 0.7));
  float n2 = snoise(puv * 3.0 - vec2(t * 0.4, t));
  float waves = (n1 * 0.65 + n2 * 0.35);

  // Halos qui dérivent (positions dépendantes du temps)
  vec3 col = vec3(0.04, 0.04, 0.10); // night-950

  vec3 violet = vec3(0.55, 0.33, 1.0);
  vec3 magenta = vec3(0.91, 0.29, 0.58);
  vec3 amber = vec3(0.96, 0.71, 0.22);

  vec2 c1 = vec2(-0.45 + sin(t * 0.6) * 0.05, 0.45 + cos(t * 0.5) * 0.04);
  vec2 c2 = vec2(0.55 + cos(t * 0.4) * 0.05, 0.10 + sin(t * 0.7) * 0.05);
  vec2 c3 = vec2(-0.10 + sin(t * 0.5 + 1.2) * 0.05, -0.45 + cos(t * 0.4) * 0.04);

  // Influence très douce de la souris (parallax max ~3% de l'écran)
  vec2 mouseShift = (u_mouse - 0.5) * 0.04;
  c1 += mouseShift;
  c2 += mouseShift * 0.7;

  col += halo(puv, c1, 0.50, violet, 0.85);
  col += halo(puv, c2, 0.45, magenta, 0.65);
  col += halo(puv, c3, 0.60, amber, 0.30);

  // Modulation par les nappes
  col *= 0.9 + waves * 0.25;

  // Vignette douce vers le bas pour assurer le contraste avec le contenu
  float vy = uv.y;
  col *= mix(1.0, 0.55, smoothstep(0.4, 1.0, vy));

  fragColor = vec4(col, 1.0);
}
`;

interface AuroraShaderProps {
  className?: string;
  /** Si true, le shader est statique (pas de boucle requestAnimationFrame). */
  staticMode?: boolean;
}

export default function AuroraShader({ className, staticMode }: AuroraShaderProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef<[number, number]>([0.5, 0.5]);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;

    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const noLoop = staticMode || reduced;

    const gl = canvas.getContext('webgl2', { antialias: false, alpha: false });
    if (!gl) {
      // Fallback : on laisse le bg du conteneur (night-950)
      return;
    }

    const compile = (src: string, type: number) => {
      const sh = gl.createShader(type)!;
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        console.warn('[AuroraShader]', gl.getShaderInfoLog(sh));
      }
      return sh;
    };

    const program = gl.createProgram()!;
    gl.attachShader(program, compile(VERT, gl.VERTEX_SHADER));
    gl.attachShader(program, compile(FRAG, gl.FRAGMENT_SHADER));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.warn('[AuroraShader]', gl.getProgramInfoLog(program));
      return;
    }
    gl.useProgram(program);

    const positions = new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]);
    const buf = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(program, 'u_resolution');
    const uTime = gl.getUniformLocation(program, 'u_time');
    const uMouse = gl.getUniformLocation(program, 'u_mouse');

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.clientWidth * dpr;
      const h = canvas.clientHeight * dpr;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
      gl.uniform2f(uRes, w, h);
    };
    resize();

    const onResize = () => resize();
    const onMove = (e: PointerEvent) => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = [
        (e.clientX - rect.left) / rect.width,
        (e.clientY - rect.top) / rect.height,
      ];
    };
    window.addEventListener('resize', onResize);
    window.addEventListener('pointermove', onMove);

    let raf = 0;
    const start = performance.now();

    const render = () => {
      resize();
      const elapsed = (performance.now() - start) / 1000;
      gl.uniform1f(uTime, elapsed);
      gl.uniform2f(uMouse, mouseRef.current[0], mouseRef.current[1]);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      if (!noLoop) raf = requestAnimationFrame(render);
    };
    render();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('pointermove', onMove);
    };
  }, [staticMode]);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className={`absolute inset-0 w-full h-full pointer-events-none ${className ?? ''}`}
    />
  );
}
