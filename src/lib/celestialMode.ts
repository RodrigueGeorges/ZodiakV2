export type CelestialMode = 'stars' | 'cursor' | 'color';

const KEY = 'zodiak.celestialMode';

export function readCelestialMode(): CelestialMode {
  if (typeof window === 'undefined') return 'stars';
  try {
    const v = localStorage.getItem(KEY);
    if (v === 'stars' || v === 'cursor' || v === 'color') return v;
  } catch {
    /* ignore */
  }
  return 'stars';
}

export function writeCelestialMode(mode: CelestialMode): void {
  try {
    localStorage.setItem(KEY, mode);
  } catch {
    /* ignore */
  }
}
