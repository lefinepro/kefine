import { describe, expect, it } from 'vitest';
import { buildCover, buildWaveform, formatTime, hashSeed } from '../music-track';

describe('buildWaveform', () => {
  it('returns the requested number of bars within [0.12, 1]', () => {
    const bars = buildWaveform('seed-a', 32);
    expect(bars).toHaveLength(32);
    for (const value of bars) {
      expect(value).toBeGreaterThanOrEqual(0.12);
      expect(value).toBeLessThanOrEqual(1);
    }
  });

  it('is deterministic for the same seed and differs across seeds', () => {
    expect(buildWaveform('alpha', 24)).toEqual(buildWaveform('alpha', 24));
    expect(buildWaveform('alpha', 24)).not.toEqual(buildWaveform('beta', 24));
  });
});

describe('buildCover', () => {
  it('produces a layered background and accent colour', () => {
    const cover = buildCover('cover-seed');
    expect(cover.background).toContain('linear-gradient');
    expect(cover.background).toContain('radial-gradient');
    expect(cover.accent).toMatch(/^hsl\(/);
  });

  it('is deterministic per seed and varies across seeds', () => {
    expect(buildCover('one')).toEqual(buildCover('one'));
    expect(buildCover('one').background).not.toEqual(buildCover('two').background);
  });
});

describe('hashSeed', () => {
  it('is stable and unsigned', () => {
    expect(hashSeed('abc')).toBe(hashSeed('abc'));
    expect(hashSeed('abc')).toBeGreaterThanOrEqual(0);
  });
});

describe('formatTime', () => {
  it('formats seconds as m:ss', () => {
    expect(formatTime(0)).toBe('0:00');
    expect(formatTime(9)).toBe('0:09');
    expect(formatTime(75)).toBe('1:15');
  });

  it('guards against invalid input', () => {
    expect(formatTime(Number.NaN)).toBe('0:00');
    expect(formatTime(-5)).toBe('0:00');
  });
});
