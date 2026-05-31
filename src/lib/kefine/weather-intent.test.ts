import { describe, expect, it } from 'vitest';
import { detectWeatherIntent, extractWeatherLocation } from './weather-intent';

describe('detectWeatherIntent', () => {
  it('matches the Russian reference phrasing from the issue', () => {
    expect(detectWeatherIntent('Погода Гомель')).toBe(true);
    expect(detectWeatherIntent('прогноз погоды в Минске')).toBe(true);
  });

  it('matches English weather phrasing', () => {
    expect(detectWeatherIntent('weather in Gomel')).toBe(true);
    expect(detectWeatherIntent('show me the forecast for New York')).toBe(true);
    expect(detectWeatherIntent('temperature Berlin')).toBe(true);
  });

  it('matches Armenian weather phrasing', () => {
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

describe('extractWeatherLocation', () => {
  it('extracts the location from Russian weather prompts', () => {
    expect(extractWeatherLocation('Погода Гомель')).toBe('Гомель');
    expect(extractWeatherLocation('прогноз погоды в минске')).toBe('Минске');
    expect(extractWeatherLocation('Погода Гомель сегодня')).toBe('Гомель');
  });

  it('extracts the location from English weather prompts', () => {
    expect(extractWeatherLocation('weather in gomel')).toBe('Gomel');
    expect(extractWeatherLocation('show me the forecast for new york')).toBe('New York');
    expect(extractWeatherLocation('berlin weather')).toBe('Berlin');
    expect(extractWeatherLocation('weather in gomel today')).toBe('Gomel');
  });

  it('falls back when no location is present', () => {
    expect(extractWeatherLocation('weather')).toBe('Gomel');
  });
});
