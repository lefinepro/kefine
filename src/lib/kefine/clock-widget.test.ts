import { describe, expect, it } from 'vitest';
import {
  detectClockIntent,
  extractClockLocationQuery,
  formatClockReadout,
  getClockTarget,
  isValidTimeZone,
  resolveClockTimeZone
} from './clock-widget';

describe('detectClockIntent', () => {
  it('matches bare time/clock prompts', () => {
    expect(detectClockIntent('time')).toBe(true);
    expect(detectClockIntent('Clock')).toBe(true);
    expect(detectClockIntent('который час')).toBe(true);
    expect(detectClockIntent('ժամը')).toBe(true);
  });

  it('matches named clock prompts', () => {
    expect(detectClockIntent('time in Tokyo')).toBe(true);
    expect(detectClockIntent('Tokyo time')).toBe(true);
    expect(detectClockIntent('который час в Минске')).toBe(true);
  });

  it('does not trigger on unrelated text or substrings', () => {
    expect(detectClockIntent('build a landing page')).toBe(false);
    expect(detectClockIntent('overtime tracking')).toBe(false);
    expect(detectClockIntent('')).toBe(false);
    expect(detectClockIntent(null)).toBe(false);
    expect(detectClockIntent('  ')).toBe(false);
  });
});

describe('extractClockLocationQuery', () => {
  it('extracts a named place from clock prompts', () => {
    expect(extractClockLocationQuery('time in Tokyo')).toBe('Tokyo');
    expect(extractClockLocationQuery('time for new york now')).toBe('New York');
    expect(extractClockLocationQuery('Berlin time')).toBe('Berlin');
    expect(extractClockLocationQuery('который час в минске')).toBe('Минске');
  });

  it('returns null when there is no place', () => {
    expect(extractClockLocationQuery('time')).toBeNull();
    expect(extractClockLocationQuery('clock now')).toBeNull();
    expect(extractClockLocationQuery(null)).toBeNull();
  });
});

describe('resolveClockTimeZone', () => {
  it('maps known city aliases to IANA zones', () => {
    expect(resolveClockTimeZone('Tokyo')).toBe('Asia/Tokyo');
    expect(resolveClockTimeZone('москва')).toBe('Europe/Moscow');
    expect(resolveClockTimeZone('Երևան')).toBe('Asia/Yerevan');
    expect(resolveClockTimeZone('UTC')).toBe('UTC');
  });

  it('accepts a raw IANA zone as-is', () => {
    expect(resolveClockTimeZone('America/Los_Angeles')).toBe('America/Los_Angeles');
  });

  it('returns null for unknown or empty places', () => {
    expect(resolveClockTimeZone('Atlantis')).toBeNull();
    expect(resolveClockTimeZone('')).toBeNull();
    expect(resolveClockTimeZone(null)).toBeNull();
  });
});

describe('isValidTimeZone', () => {
  it('accepts valid zones and rejects invalid ones', () => {
    expect(isValidTimeZone('Europe/Paris')).toBe(true);
    expect(isValidTimeZone('UTC')).toBe(true);
    expect(isValidTimeZone('Not/AZone')).toBe(false);
    expect(isValidTimeZone('')).toBe(false);
  });
});

describe('getClockTarget', () => {
  it('uses the local clock for bare prompts', () => {
    expect(getClockTarget('time')).toEqual({ kind: 'local' });
    expect(getClockTarget('clock now')).toEqual({ kind: 'local' });
  });

  it('resolves a named place to a timezone', () => {
    expect(getClockTarget('time in Tokyo')).toEqual({
      kind: 'named',
      query: 'Tokyo',
      timeZone: 'Asia/Tokyo'
    });
  });

  it('falls back to local when the place is unknown', () => {
    expect(getClockTarget('time in Atlantis')).toEqual({ kind: 'local' });
  });

  it('returns null when there is no clock intent', () => {
    expect(getClockTarget('build a landing page')).toBeNull();
  });
});

describe('formatClockReadout', () => {
  // 2026-06-05T08:30:45Z — a fixed instant so the assertions stay stable.
  const instant = new Date('2026-06-05T08:30:45.000Z');

  it('formats the UTC clock with weekday and date', () => {
    const readout = formatClockReadout(instant, 'UTC', 'en-GB');
    expect(readout.time).toBe('08:30');
    expect(readout.seconds).toBe('45');
    expect(readout.weekday).toBe('Friday');
    expect(readout.date).toBe('5 June 2026');
    expect(readout.zoneLabel).toBe('UTC');
  });

  it('applies a named timezone offset', () => {
    const readout = formatClockReadout(instant, 'Asia/Tokyo', 'en-GB');
    // Tokyo is UTC+9, so 08:30 UTC is 17:30 local.
    expect(readout.time).toBe('17:30');
    expect(readout.weekday).toBe('Friday');
  });

  it('falls back to the local zone for an invalid timezone', () => {
    const readout = formatClockReadout(instant, 'Not/AZone', 'en-GB');
    expect(readout.time).toMatch(/^\d{2}:\d{2}$/);
  });
});
