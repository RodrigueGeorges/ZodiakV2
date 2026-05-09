import { useEffect, useRef } from 'react';
import {
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
  BufferGeometry,
  Float32BufferAttribute,
  Vector2,
  Vector3,
  RawShaderMaterial,
  Points,
  AdditiveBlending,
} from 'three';

/**
 * Port fidèle du composant Framer Marketplace « StarParticleCursor »
 * (Nitso — shaders & logique depuis le bundle public Framer, sans runtime `framer`).
 *
 * Licence : vérifie l’usage commercial avec ta licence Framer Marketplace.
 */

const VERTEX_SHADER = `
precision highp float;
precision highp int;

attribute vec3 position;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;

attribute vec4 mouse;
attribute vec2 aFront;
attribute float random;

uniform vec2 resolution;
uniform float pixelRatio;
uniform float timestamp;

uniform float size;
uniform float minSize;
uniform float speed;
uniform float spread;
uniform float maxSpread;
uniform float maxZ;
uniform float maxDiff;
uniform float diffPow;

varying float vProgress;
varying float vRandom;
varying float vDiff;
varying float vSpreadLength;
varying float vPositionZ;

float cubicOut(float t) {
  float f = t - 1.0;
  return f * f * f + 1.0;
}

const float PI = 3.1415926;
const float PI2 = PI * 2.;

void main () {
  float progress = clamp((timestamp - mouse.z) * speed, 0., 1.);
  progress *= step(0., mouse.x);

  float startX = mouse.x - resolution.x / 2.;
  float startY = mouse.y - resolution.y / 2.;
  vec3 startPosition = vec3(startX, startY, random);

  float diff = clamp(mouse.w / maxDiff, 0., 1.);
  diff = pow(diff, diffPow);

  vec3 cPosition = position * 2. - 1.;

  float radian = cPosition.x * PI2 - PI;
  vec2 xySpread = vec2(cos(radian), sin(radian)) * spread * mix(1., maxSpread, diff) * cPosition.y;

  vec3 endPosition = startPosition;
  endPosition.xy += xySpread;
  endPosition.z += cPosition.z * maxZ * (pixelRatio > 1. ? 1.2 : 1.);

  float positionProgress = cubicOut(progress * random);
  vec3 currentPosition = mix(startPosition, endPosition, positionProgress);

  vProgress = progress;
  vRandom = random;
  vDiff = diff;
  vSpreadLength = cPosition.y;
  vPositionZ = position.z;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(currentPosition, 1.);
  gl_PointSize = max(currentPosition.z * size * diff * pixelRatio, minSize * (pixelRatio > 1. ? 1.3 : 1.));
}
`;

const FRAGMENT_SHADER = `
precision highp float;
precision highp int;

uniform float fadeSpeed;
uniform float shortRangeFadeSpeed;
uniform float minFlashingSpeed;
uniform float blur;
uniform vec3 starColor;

varying float vProgress;
varying float vRandom;
varying float vDiff;
varying float vSpreadLength;
varying float vPositionZ;

highp float random(vec2 co) {
    highp float a = 12.9898;
    highp float b = 78.233;
    highp float c = 43758.5453;
    highp float dt= dot(co.xy ,vec2(a,b));
    highp float sn= mod(dt,3.14);
    return fract(sin(sn) * c);
}

float quadraticIn(float t) {
  return t * t;
}

#ifndef HALF_PI
#define HALF_PI 1.5707963267948966
#endif

float sineOut(float t) {
  return sin(t * HALF_PI);
}

void main(){
    vec2 p = gl_PointCoord * 2. - 1.;
    float len = length(p);

  float cRandom = random(vec2(vProgress * mix(minFlashingSpeed, 1., vRandom)));
  cRandom = mix(0.3, 2., cRandom);

  float cBlur = blur * mix(1., 0.3, vPositionZ);
    float shape = smoothstep(1. - cBlur, 1. + cBlur, (1. - cBlur) / len);
  shape *= mix(0.5, 1., vRandom);

  if (shape == 0.) discard;

  float darkness = mix(0.1, 1., vPositionZ);

  float alphaProgress = vProgress * fadeSpeed * mix(2.5, 1., pow(vDiff, 0.6));
  alphaProgress *= mix(shortRangeFadeSpeed, 1., sineOut(vSpreadLength) * quadraticIn(vDiff));
  float alpha = 1. - min(alphaProgress, 1.);
  alpha *= cRandom * vDiff;

    gl_FragColor = vec4(starColor * darkness * cRandom, shape * alpha);
}
`;

function parseFramerColor(color: string): { r: number; g: number; b: number } {
  const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (rgbMatch) {
    return {
      r: parseInt(rgbMatch[1]!, 10) / 255,
      g: parseInt(rgbMatch[2]!, 10) / 255,
      b: parseInt(rgbMatch[3]!, 10) / 255,
    };
  }
  const rgbaMatch = color.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*[\d.]+\)/);
  if (rgbaMatch) {
    return {
      r: parseInt(rgbaMatch[1]!, 10) / 255,
      g: parseInt(rgbaMatch[2]!, 10) / 255,
      b: parseInt(rgbaMatch[3]!, 10) / 255,
    };
  }
  const hexMatch = color.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (hexMatch) {
    return {
      r: parseInt(hexMatch[1]!, 16) / 255,
      g: parseInt(hexMatch[2]!, 16) / 255,
      b: parseInt(hexMatch[3]!, 16) / 255,
    };
  }
  return { r: 170 / 255, g: 133 / 255, b: 88 / 255 };
}

export interface StarParticleCursorProps {
  hideOnMobile?: 'hide' | 'visible';
  showCursor?: boolean;
  starColor?: string;
  particleSize?: number;
  minParticleSize?: number;
  blurAmount?: number;
  speed?: number;
  fadeSpeed?: number;
  shortRangeFade?: number;
  flashingSpeed?: number;
  spreadRadius?: number;
  maxSpread?: number;
  depth?: number;
  motionSensitivity?: number;
  motionEffect?: number;
}

const PER_MOUSE = 800;
const COUNT = PER_MOUSE * 400;
const MOUSE_ATTRIBUTE_COUNT = 4;

const DEFAULTS = {
  hideOnMobile: 'hide' as const,
  showCursor: false,
  starColor: '#aa8558',
  particleSize: 8,
  minParticleSize: 5,
  blurAmount: 8,
  speed: 1,
  fadeSpeed: 14,
  shortRangeFade: 10,
  flashingSpeed: 10,
  spreadRadius: 20,
  maxSpread: 2,
  depth: 100,
  motionSensitivity: 250,
  motionEffect: 24,
};

export default function StarParticleCursor(raw: StarParticleCursorProps) {
  const props = { ...DEFAULTS, ...raw };
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const reduceMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion || !canvasRef.current) return;

    if (
      props.hideOnMobile === 'hide' &&
      typeof window !== 'undefined' &&
      window.innerWidth <= 768
    ) {
      return undefined;
    }

    const canvas = canvasRef.current;
    let width = window.innerWidth;
    let height = window.innerHeight;

    const converted = () => ({
      size: props.particleSize / 100,
      minSize: props.minParticleSize / 10,
      speed: props.speed / 1e3,
      fadeSpeed: props.fadeSpeed / 10,
      shortRangeFade: props.shortRangeFade / 10,
      minFlashingSpeed: props.flashingSpeed / 100,
      blur: props.blurAmount / 10,
      diffPow: props.motionEffect / 100,
    });

    const scene = new Scene();
    const camera = new PerspectiveCamera(
      (Math.atan(height / 2 / 5000) * (180 / Math.PI)) * 2,
      width / height,
      0.1,
      10000,
    );
    camera.position.z = 5000;

    const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio ?? 1, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.setSize(width, height);

    const geometry = new BufferGeometry();
    const positions: number[] = [];
    const mouseArr: number[] = [];
    const aFront: number[] = [];
    const randomArr: number[] = [];
    for (let i = 0; i < COUNT; i++) {
      positions.push(Math.random(), Math.random(), Math.random());
      mouseArr.push(-1, -1, 0, 0);
      aFront.push(0, 0);
      randomArr.push(Math.random());
    }

    geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
    geometry.setAttribute('mouse', new Float32BufferAttribute(mouseArr, MOUSE_ATTRIBUTE_COUNT));
    geometry.setAttribute('aFront', new Float32BufferAttribute(aFront, 2));
    geometry.setAttribute('random', new Float32BufferAttribute(randomArr, 1));

    let cv = converted();
    const colorRgb = parseFramerColor(props.starColor);

    const uniforms = {
      resolution: { value: new Vector2(width, height) },
      pixelRatio: { value: renderer.getPixelRatio() },
      timestamp: { value: 0 },
      starColor: { value: new Vector3(colorRgb.r, colorRgb.g, colorRgb.b) },
      size: { value: cv.size },
      minSize: { value: cv.minSize },
      speed: { value: cv.speed },
      fadeSpeed: { value: cv.fadeSpeed },
      shortRangeFadeSpeed: { value: cv.shortRangeFade },
      minFlashingSpeed: { value: cv.minFlashingSpeed },
      spread: { value: props.spreadRadius },
      maxSpread: { value: props.maxSpread },
      maxZ: { value: props.depth },
      blur: { value: cv.blur },
      maxDiff: { value: props.motionSensitivity },
      diffPow: { value: cv.diffPow },
    };

    const material = new RawShaderMaterial({
      uniforms,
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      transparent: true,
      depthTest: false,
      blending: AdditiveBlending,
    });

    const mesh = new Points(geometry, material);
    mesh.frustumCulled = false;
    scene.add(mesh);

    let mouseI = 0;
    let oldPosition: Vector2 | null = null;

    const handleMouseMove = (e: MouseEvent) => {
      height = window.innerHeight;
      width = window.innerWidth;
      const x = e.clientX;
      const y = height - e.clientY;
      const newPosition = new Vector2(x, y);
      const diff = oldPosition ? newPosition.clone().sub(oldPosition) : new Vector2();
      const length = diff.length();
      const front = new Vector2(1, 0);
      if (length > 1e-8) front.copy(diff).normalize();
      const mouseAttr = geometry.attributes.mouse;
      const frontAttr = geometry.attributes.aFront;
      const mArr = mouseAttr.array as Float32Array;
      const fArr = frontAttr.array as Float32Array;

      for (let i = 0; i < PER_MOUSE; i++) {
        const ci = (mouseI % (COUNT * MOUSE_ATTRIBUTE_COUNT)) + i * MOUSE_ATTRIBUTE_COUNT;
        const vertexIndex = ci / MOUSE_ATTRIBUTE_COUNT;
        const fi = vertexIndex * 2;
        const position = oldPosition
          ? oldPosition.clone().add(diff.clone().multiplyScalar(i / PER_MOUSE))
          : newPosition;
        mArr[ci] = position.x;
        mArr[ci + 1] = position.y;
        mArr[ci + 2] = performance.now();
        mArr[ci + 3] = length;
        if (fi >= 0 && fi + 1 < fArr.length) {
          fArr[fi] = front.x;
          fArr[fi + 1] = front.y;
        }
      }
      oldPosition = newPosition;
      mouseI += MOUSE_ATTRIBUTE_COUNT * PER_MOUSE;
      mouseAttr.needsUpdate = true;
      frontAttr.needsUpdate = true;
    };

    const animate = (timestamp: number) => {
      cv = converted();
      const rgb = parseFramerColor(props.starColor);
      material.uniforms.timestamp.value = timestamp;
      material.uniforms.starColor.value.set(rgb.r, rgb.g, rgb.b);
      material.uniforms.size.value = cv.size;
      material.uniforms.minSize.value = cv.minSize;
      material.uniforms.speed.value = cv.speed;
      material.uniforms.fadeSpeed.value = cv.fadeSpeed;
      material.uniforms.shortRangeFadeSpeed.value = cv.shortRangeFade;
      material.uniforms.minFlashingSpeed.value = cv.minFlashingSpeed;
      material.uniforms.spread.value = props.spreadRadius;
      material.uniforms.maxSpread.value = props.maxSpread;
      material.uniforms.maxZ.value = props.depth;
      material.uniforms.blur.value = cv.blur;
      material.uniforms.maxDiff.value = props.motionSensitivity;
      material.uniforms.diffPow.value = cv.diffPow;
      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };

    let raf = requestAnimationFrame(animate);

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      camera.aspect = width / height;
      camera.fov = (Math.atan(height / 2 / 5000) * (180 / Math.PI)) * 2;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      material.uniforms.resolution.value.set(width, height);
    };

    const prevCursor = document.body.style.cursor;
    document.body.style.cursor = props.showCursor ? '' : 'none';
    document.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('resize', handleResize);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      document.body.style.cursor = prevCursor;
      cancelAnimationFrame(raf);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
    };
  }, [
    props.hideOnMobile,
    props.showCursor,
    props.starColor,
    props.particleSize,
    props.minParticleSize,
    props.blurAmount,
    props.speed,
    props.fadeSpeed,
    props.shortRangeFade,
    props.flashingSpeed,
    props.spreadRadius,
    props.maxSpread,
    props.depth,
    props.motionSensitivity,
    props.motionEffect,
  ]);

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[15] overflow-hidden"
      aria-hidden
    >
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 block h-full w-full"
      />
    </div>
  );
}
