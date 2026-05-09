/**
 * sounds.ts — sons d'interaction subtils façon Co-Star / CHANI.
 *
 * - Tous les sons sont générés à la volée via Web Audio API (zéro asset).
 * - Toggle global persisté dans localStorage (clef `zodiak.sounds.enabled`).
 * - Volume volontairement bas pour rester poétique.
 * - Pas de son si `prefers-reduced-motion` ou si l'API n'est pas dispo.
 */

const STORAGE_KEY = 'zodiak.sounds.enabled';
const DEFAULT_VOLUME = 0.06;

let ctx: AudioContext | null = null;

export type SoundKey =
  | 'whoosh' // refresh / actualisation
  | 'chime' // streak / mood validé
  | 'pop' // tap subtil
  | 'shimmer'; // reveal magique (anniversaire)

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!ctx) {
      const Ctor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (!Ctor) return null;
      ctx = new Ctor();
    }
    return ctx;
  } catch {
    return null;
  }
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

export function isSoundEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    // Par défaut : DÉSACTIVÉ. L'utilisateur l'active explicitement.
    return v === 'true';
  } catch {
    return false;
  }
}

export function setSoundEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY, String(enabled));
  } catch {
    /* ignore */
  }
}

interface ToneSpec {
  freq: number;
  duration: number; // sec
  type?: OscillatorType;
  attack?: number;
  release?: number;
  volume?: number;
}

function playTone(c: AudioContext, spec: ToneSpec, startAt = 0): void {
  const t0 = c.currentTime + startAt;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = spec.type ?? 'sine';
  osc.frequency.value = spec.freq;

  const attack = spec.attack ?? 0.015;
  const release = spec.release ?? 0.18;
  const peak = (spec.volume ?? DEFAULT_VOLUME);

  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(peak, t0 + attack);
  gain.gain.linearRampToValueAtTime(0, t0 + spec.duration + release);

  osc.connect(gain);
  gain.connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + spec.duration + release + 0.05);
}

/**
 * Joue un son. Silencieux si désactivé ou non supporté.
 * `force = true` permet de jouer même si l'utilisateur a désactivé
 * (utile pour le feedback test du toggle).
 */
export function playSound(key: SoundKey, opts?: { force?: boolean }): void {
  if (!opts?.force) {
    if (!isSoundEnabled() || prefersReducedMotion()) return;
  }
  const c = getContext();
  if (!c) return;

  // Resume context if suspended (Safari iOS au premier geste)
  if (c.state === 'suspended') {
    c.resume().catch(() => {});
  }

  switch (key) {
    case 'whoosh': {
      // Trois harmoniques douces qui descendent
      playTone(c, { freq: 880, duration: 0.06, type: 'sine', volume: 0.05 });
      playTone(c, { freq: 660, duration: 0.08, type: 'sine', volume: 0.045 }, 0.04);
      playTone(c, { freq: 440, duration: 0.1, type: 'sine', volume: 0.04 }, 0.08);
      break;
    }
    case 'chime': {
      // Carillon cristallin (tierce mineure ascendante)
      playTone(c, { freq: 587.33, duration: 0.12, volume: 0.06 }); // ré5
      playTone(c, { freq: 880, duration: 0.18, volume: 0.05 }, 0.08); // la5
      playTone(c, { freq: 1318.51, duration: 0.22, volume: 0.04 }, 0.16); // mi6
      break;
    }
    case 'pop': {
      playTone(c, {
        freq: 540,
        duration: 0.04,
        type: 'triangle',
        volume: 0.035,
        release: 0.08,
      });
      break;
    }
    case 'shimmer': {
      // 5 notes très lumineuses (gamme pentatonique)
      const notes = [523.25, 659.25, 783.99, 987.77, 1318.51];
      notes.forEach((f, i) => {
        playTone(
          c,
          { freq: f, duration: 0.18, volume: 0.045 - i * 0.005 },
          i * 0.07,
        );
      });
      break;
    }
  }
}
