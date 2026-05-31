export type WeatherUnit = 'celsius' | 'fahrenheit';

export type WeatherCondition =
  | 'mostly-cloudy'
  | 'partly-cloudy'
  | 'sunny'
  | 'clear-night'
  | 'rain'
  | 'cloudy';

export interface WeatherHour {
  time: string;
  condition: WeatherCondition;
  temperatureC: number;
  precipitationChance: number;
}

export interface WeatherDay {
  dayIndex: number;
  condition: WeatherCondition;
  highC: number;
  lowC: number;
  precipitationChance: number;
}

export interface WeatherForecast {
  location: string;
  countryCode: 'belarus' | null;
  condition: WeatherCondition;
  currentTempC: number;
  feelsLikeC: number;
  humidity: number;
  windKph: number;
  pressureHpa: number;
  hourly: WeatherHour[];
  daily: WeatherDay[];
}

const BASE_HOURLY: readonly WeatherHour[] = [
  { time: '13', condition: 'mostly-cloudy', temperatureC: 14, precipitationChance: 6 },
  { time: '16', condition: 'partly-cloudy', temperatureC: 16, precipitationChance: 6 },
  { time: '19', condition: 'sunny', temperatureC: 16, precipitationChance: 2 },
  { time: '22', condition: 'clear-night', temperatureC: 11, precipitationChance: 1 },
  { time: '1', condition: 'clear-night', temperatureC: 8, precipitationChance: 0 },
  { time: '4', condition: 'clear-night', temperatureC: 7, precipitationChance: 0 },
  { time: '7', condition: 'sunny', temperatureC: 10, precipitationChance: 0 },
  { time: '10', condition: 'sunny', temperatureC: 16, precipitationChance: 0 }
];

const BASE_DAILY: readonly WeatherDay[] = [
  { dayIndex: 0, condition: 'sunny', highC: 17, lowC: 7, precipitationChance: 0 },
  { dayIndex: 1, condition: 'partly-cloudy', highC: 20, lowC: 7, precipitationChance: 0 },
  { dayIndex: 2, condition: 'sunny', highC: 23, lowC: 9, precipitationChance: 0 },
  { dayIndex: 3, condition: 'partly-cloudy', highC: 23, lowC: 12, precipitationChance: 0 },
  { dayIndex: 4, condition: 'partly-cloudy', highC: 23, lowC: 13, precipitationChance: 0 },
  { dayIndex: 5, condition: 'rain', highC: 25, lowC: 19, precipitationChance: 50 },
  { dayIndex: 6, condition: 'rain', highC: 26, lowC: 19, precipitationChance: 40 }
];

function hashLocation(location: string): number {
  return Array.from(location).reduce((sum, char) => sum + char.charCodeAt(0), 0);
}

function isGomel(location: string): boolean {
  const normalized = location.toLowerCase();
  return normalized.includes('gomel') || normalized.includes('гомел');
}

function shiftedTemp(value: number, offset: number): number {
  return value + offset;
}

export function toFahrenheit(celsius: number): number {
  return Math.round((celsius * 9) / 5 + 32);
}

export function formatTemperature(celsius: number, unit: WeatherUnit): string {
  const value = unit === 'fahrenheit' ? toFahrenheit(celsius) : Math.round(celsius);
  return `${value}°`;
}

export function buildWeatherForecast(location: string): WeatherForecast {
  const displayLocation = location.trim() || 'Gomel';
  const offset = isGomel(displayLocation) ? 0 : (hashLocation(displayLocation) % 5) - 2;

  return {
    location: displayLocation,
    countryCode: isGomel(displayLocation) ? 'belarus' : null,
    condition: 'mostly-cloudy',
    currentTempC: shiftedTemp(14, offset),
    feelsLikeC: shiftedTemp(13, offset),
    humidity: Math.max(45, Math.min(82, 63 + offset * 2)),
    windKph: Math.max(8, 18 + offset),
    pressureHpa: 1014 - offset,
    hourly: BASE_HOURLY.map((hour) => ({
      ...hour,
      temperatureC: shiftedTemp(hour.temperatureC, offset)
    })),
    daily: BASE_DAILY.map((day) => ({
      ...day,
      highC: shiftedTemp(day.highC, offset),
      lowC: shiftedTemp(day.lowC, offset)
    }))
  };
}
