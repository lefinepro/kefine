import { describe, expect, it } from 'vitest';
import {
  buildWeatherForecastFromOpenMeteo,
  formatTemperature,
  resolveKnownWeatherLocation,
  toFahrenheit,
  toKelvin
} from '../weather-forecast';

const forecastResponse = {
  current: {
    time: '2026-05-31T14:00',
    temperature_2m: 14.4,
    apparent_temperature: 13.1,
    relative_humidity_2m: 60,
    wind_speed_10m: 8.7,
    pressure_msl: 1010.1,
    weather_code: 2
  },
  hourly: {
    time: [
      '2026-05-31T13:00',
      '2026-05-31T14:00',
      '2026-05-31T15:00',
      '2026-05-31T16:00',
      '2026-05-31T17:00',
      '2026-05-31T18:00',
      '2026-05-31T19:00',
      '2026-05-31T20:00',
      '2026-05-31T21:00'
    ],
    temperature_2m: [13, 14.4, 16.2, 17.1, 17.4, 16.8, 15.3, 13.2, 12],
    precipitation_probability: [0, 5, 6, 8, 10, 12, 8, 4, 2],
    weather_code: [2, 2, 2, 1, 1, 0, 0, 0, 0]
  },
  daily: {
    time: [
      '2026-05-31',
      '2026-06-01',
      '2026-06-02',
      '2026-06-03',
      '2026-06-04',
      '2026-06-05',
      '2026-06-06'
    ],
    weather_code: [2, 3, 61, 1, 0, 80, 45],
    temperature_2m_max: [17.2, 20.1, 21.4, 22.8, 24.1, 19.6, 18.7],
    temperature_2m_min: [7.3, 8.1, 9.5, 11.2, 12.8, 10.4, 9.2],
    precipitation_probability_max: [6, 10, 60, 5, 0, 75, 20]
  }
};

describe('weather forecast formatting', () => {
  it('converts celsius values to fahrenheit', () => {
    expect(toFahrenheit(14)).toBe(57);
    expect(formatTemperature(14.4, 'celsius')).toBe('14°');
    expect(formatTemperature(14.4, 'fahrenheit')).toBe('58°');
  });

  it('converts celsius values to kelvin', () => {
    expect(toKelvin(14)).toBe(287);
    expect(toKelvin(0)).toBe(273);
    expect(toKelvin(-273)).toBe(0);
    expect(formatTemperature(14.4, 'kelvin')).toBe('288°');
  });
});

describe('resolveKnownWeatherLocation', () => {
  it('maps Gomel spellings to the Belarus forecast coordinates', () => {
    expect(resolveKnownWeatherLocation('Gomel')).toMatchObject({
      name: 'Gomel',
      country: 'Belarus',
      latitude: 52.4345,
      longitude: 30.9754
    });
    expect(resolveKnownWeatherLocation('Гомель')).toMatchObject({
      name: 'Гомель',
      country: 'Belarus'
    });
  });
});

describe('buildWeatherForecastFromOpenMeteo', () => {
  it('normalizes Open-Meteo data for the weather widget', () => {
    const forecast = buildWeatherForecastFromOpenMeteo(
      {
        name: 'Gomel',
        country: 'Belarus',
        latitude: 52.4345,
        longitude: 30.9754
      },
      forecastResponse
    );

    expect(forecast.location).toBe('Gomel');
    expect(forecast.country).toBe('Belarus');
    expect(forecast.condition).toBe('partly-cloudy');
    expect(forecast.currentTempC).toBe(14.4);
    expect(forecast.feelsLikeC).toBe(13.1);
    expect(forecast.humidity).toBe(60);
    expect(forecast.windKph).toBe(9);
    expect(forecast.pressureHpa).toBe(1010);
    expect(forecast.hourly).toHaveLength(8);
    expect(forecast.hourly[0]).toMatchObject({
      time: '14',
      condition: 'partly-cloudy',
      temperatureC: 14.4,
      precipitationChance: 5
    });
    expect(forecast.daily).toHaveLength(7);
    expect(forecast.daily[2]).toMatchObject({
      label: 'Tue',
      condition: 'rain',
      highC: 21.4,
      lowC: 9.5,
      precipitationChance: 60
    });
  });
});
