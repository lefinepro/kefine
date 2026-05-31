import { describe, expect, it } from 'vitest';
import { detectWeatherIntent, getWeatherTarget } from './weather-intent';

describe('detectWeatherIntent', () => {
  it('matches bare weather prompts that should use geolocation', () => {
    expect(detectWeatherIntent('Weather')).toBe(true);
    expect(detectWeatherIntent('Погода')).toBe(true);
    expect(detectWeatherIntent('եղանակ')).toBe(true);
  });

  it('matches named weather prompts', () => {
    expect(detectWeatherIntent('Weather Gomel,')).toBe(true);
    expect(detectWeatherIntent('weather in New York')).toBe(true);
    expect(detectWeatherIntent('прогноз погоды в Минске')).toBe(true);
    expect(detectWeatherIntent('եղանակը Երևան')).toBe(true);
  });

  it('does not trigger on unrelated text or substrings', () => {
    expect(detectWeatherIntent('build a landing page')).toBe(false);
    expect(detectWeatherIntent('weathered oak color palette')).toBe(false);
    expect(detectWeatherIntent('')).toBe(false);
    expect(detectWeatherIntent(null)).toBe(false);
    expect(detectWeatherIntent('   ')).toBe(false);
  });
});

describe('getWeatherTarget', () => {
  it('uses geolocation when a weather prompt has no explicit place', () => {
    expect(getWeatherTarget('Weather')).toEqual({ kind: 'geolocation' });
    expect(getWeatherTarget('Погода сейчас')).toEqual({ kind: 'geolocation' });
  });

  it('extracts a named place from English weather prompts', () => {
    expect(getWeatherTarget('Weather Gomel,')).toEqual({ kind: 'named', query: 'Gomel' });
    expect(getWeatherTarget('weather in gomel today')).toEqual({ kind: 'named', query: 'Gomel' });
    expect(getWeatherTarget('show me the forecast for new york')).toEqual({ kind: 'named', query: 'New York' });
    expect(getWeatherTarget('berlin weather')).toEqual({ kind: 'named', query: 'Berlin' });
  });

  it('extracts a named place from Russian and Armenian weather prompts', () => {
    expect(getWeatherTarget('Погода Гомель')).toEqual({ kind: 'named', query: 'Гомель' });
    expect(getWeatherTarget('прогноз погоды в минске')).toEqual({ kind: 'named', query: 'Минске' });
    expect(getWeatherTarget('եղանակը Երևան')).toEqual({ kind: 'named', query: 'Երևան' });
  });

  it('ignores non-weather prompts', () => {
    expect(getWeatherTarget('make a proxy server')).toBeNull();
  });
});
