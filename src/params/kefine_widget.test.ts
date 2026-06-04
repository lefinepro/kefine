import { describe, expect, it } from 'vitest';
import { match } from './kefine_widget';

describe('kefine_widget route matcher', () => {
  it('matches known widget short-link slugs and aliases', () => {
    expect(match('weather')).toBe(true);
    expect(match('forecast')).toBe(true);
    expect(match('clock')).toBe(true);
    expect(match('time')).toBe(true);
    expect(match('translate')).toBe(true);
    expect(match('translator')).toBe(true);
    expect(match('music')).toBe(true);
  });

  it('does not match unrelated path segments (e.g. share ids)', () => {
    expect(match('weatherly')).toBe(false);
    expect(match('3k4n2lk4n2lk4n2l')).toBe(false);
    expect(match('orders')).toBe(false);
  });
});
