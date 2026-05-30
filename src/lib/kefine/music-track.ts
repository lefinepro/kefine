/**
 * Pure, deterministic data for the "extract music from video" widget (issue #88).
 *
 * The widget is a *preview* shown before any task is submitted. Until the real
 * audio-from-video pipeline exists, it plays one hardcoded sound "for speed" and
 * paints a randomly generated cover background. Everything here is seedable so
 * the same seed always yields the same waveform / cover — that keeps SSR and the
 * first client render in sync (no hydration mismatch), while the widget can still
 * roll a fresh random seed on demand to regenerate the background.
 */

export interface MusicTrack {
  id: string;
  /** Path to the hardcoded audio file shipped in static/. */
  source: string;
  /** Fallback duration label shown before metadata loads. */
  durationLabel: string;
}

/** The single hardcoded sample (see scripts/generate-music-sample.mjs). */
export const EXTRACTED_TRACK: MusicTrack = {
  id: 'extracted-001',
  source: '/kefine-extracted-track.wav',
  durationLabel: '0:12'
};

/** Tiny FNV-1a hash → unsigned 32-bit int, for stable seeding from a string. */
export function hashSeed(seed: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < seed.length; index++) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}

/** Deterministic mulberry32 PRNG — a stream of [0, 1) floats from a numeric seed. */
function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Build a stable list of waveform bar heights (each in [0.12, 1]) for the given
 * seed. The shape is smoothed so neighbouring bars relate, giving the organic
 * look of a real audio envelope rather than random noise.
 */
export function buildWaveform(seed: string, bars = 40): number[] {
  const rand = mulberry32(hashSeed(`wave:${seed}`));
  const raw = Array.from({ length: bars }, () => rand());
  return raw.map((value, index) => {
    const prev = raw[index - 1] ?? value;
    const next = raw[index + 1] ?? value;
    const smoothed = (prev + value * 2 + next) / 4;
    // Bias toward a centre-weighted swell so the clip reads as "music".
    const swell = Math.sin((index / (bars - 1)) * Math.PI);
    return Math.max(0.12, Math.min(1, smoothed * 0.7 + swell * 0.45));
  });
}

export interface MusicCover {
  /** CSS background value: layered radial blobs over a diagonal base gradient. */
  background: string;
  /** Dominant accent colour, e.g. for the play button glow. */
  accent: string;
}

/**
 * Generate a random-looking cover background from a seed. Hues are spread across
 * the wheel so each regeneration feels distinct, while saturation/lightness stay
 * in a warm, muted band that sits comfortably inside the Lefine palette.
 */
export function buildCover(seed: string): MusicCover {
  const rand = mulberry32(hashSeed(`cover:${seed}`));
  const baseHue = Math.floor(rand() * 360);
  const hue2 = (baseHue + 30 + Math.floor(rand() * 90)) % 360;
  const hue3 = (baseHue + 180 + Math.floor(rand() * 60)) % 360;
  const angle = Math.floor(rand() * 360);

  const blob = (hue: number) => {
    const x = Math.floor(15 + rand() * 70);
    const y = Math.floor(15 + rand() * 70);
    const sat = 58 + Math.floor(rand() * 24);
    const light = 48 + Math.floor(rand() * 20);
    return `radial-gradient(circle at ${x}% ${y}%, hsl(${hue} ${sat}% ${light}%) 0%, transparent 55%)`;
  };

  const background = [
    blob(baseHue),
    blob(hue2),
    blob(hue3),
    `linear-gradient(${angle}deg, hsl(${baseHue} 46% 30%), hsl(${hue3} 50% 22%))`
  ].join(', ');

  return { background, accent: `hsl(${baseHue} 70% 62%)` };
}

/** Generate a fresh random seed string (browser only — keep SSR deterministic). */
export function randomCoverSeed(): string {
  return Math.floor(Math.random() * 0xffffffff).toString(36);
}

/** Format a number of seconds as m:ss (e.g. 75 → "1:15"). */
export function formatTime(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) {
    return '0:00';
  }
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
