export type WeatherUnit = 'celsius' | 'fahrenheit';

export type WeatherCondition =
  | 'mostly-cloudy'
  | 'partly-cloudy'
  | 'sunny'
  | 'clear-night'
  | 'rain'
  | 'cloudy';

export interface WeatherResolvedLocation {
  name: string;
  country?: string;
  countryCode?: string;
  latitude: number;
  longitude: number;
}

export interface WeatherHour {
  time: string;
  condition: WeatherCondition;
  temperatureC: number;
  precipitationChance: number;
}

export interface WeatherDay {
  date: string;
  label: string;
  weekdayIndex: number;
  condition: WeatherCondition;
  highC: number;
  lowC: number;
  precipitationChance: number;
}

export interface WeatherForecast {
  location: string;
  country: string | null;
  condition: WeatherCondition;
  currentTempC: number;
  feelsLikeC: number;
  humidity: number;
  windKph: number;
  pressureHpa: number;
  hourly: WeatherHour[];
  daily: WeatherDay[];
}

type OpenMeteoForecastResponse = {
  current?: {
    time?: string;
    temperature_2m?: number;
    apparent_temperature?: number;
    relative_humidity_2m?: number;
    wind_speed_10m?: number;
    pressure_msl?: number;
    weather_code?: number;
  };
  hourly?: {
    time?: string[];
    temperature_2m?: number[];
    precipitation_probability?: number[];
    weather_code?: number[];
  };
  daily?: {
    time?: string[];
    weather_code?: number[];
    temperature_2m_max?: number[];
    temperature_2m_min?: number[];
    precipitation_probability_max?: number[];
  };
};

type OpenMeteoGeocodeResponse = {
  results?: Array<{
    name?: string;
    latitude?: number;
    longitude?: number;
    country?: string;
    country_code?: string;
  }>;
};

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

const KNOWN_LOCATIONS: ReadonlyArray<{
  aliases: readonly string[];
  location: WeatherResolvedLocation;
}> = [
  {
    aliases: ['gomel', 'homel', 'homyel', 'гомель', 'гомеля'],
    location: {
      name: 'Gomel',
      country: 'Belarus',
      countryCode: 'BY',
      latitude: 52.4345,
      longitude: 30.9754
    }
  }
];

function normalizeLookup(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');
}

function numberAt(values: number[] | undefined, index: number, fallback: number): number {
  const value = values?.[index];
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function roundNumber(value: number, fallback = 0): number {
  return Number.isFinite(value) ? Math.round(value) : fallback;
}

function hourLabel(value: string | undefined): string {
  const match = value?.match(/T(\d{2})/);
  if (!match) {
    return '';
  }

  return String(Number(match[1]));
}

function weekdayFromDate(value: string | undefined): { index: number; label: string } {
  const parts = value?.split('-').map((part) => Number(part));
  if (!parts || parts.length < 3 || parts.some((part) => !Number.isFinite(part))) {
    return { index: 0, label: WEEKDAYS[0] };
  }

  const date = new Date(Date.UTC(parts[0] as number, (parts[1] as number) - 1, parts[2] as number));
  const index = date.getUTCDay();
  return { index, label: WEEKDAYS[index] ?? WEEKDAYS[0] };
}

function currentHourlyIndex(times: string[] | undefined, currentTime: string | undefined): number {
  if (!times || times.length === 0) {
    return 0;
  }

  const exact = currentTime ? times.findIndex((time) => time === currentTime) : -1;
  if (exact >= 0) {
    return exact;
  }

  return Math.max(0, times.findIndex((time) => currentTime && time > currentTime));
}

export function toFahrenheit(celsius: number): number {
  return Math.round((celsius * 9) / 5 + 32);
}

export function formatTemperature(celsius: number, unit: WeatherUnit): string {
  const value = unit === 'fahrenheit' ? toFahrenheit(celsius) : Math.round(celsius);
  return `${value}°`;
}

export function weatherCodeToCondition(code: number | undefined): WeatherCondition {
  if (code === 0) return 'sunny';
  if (code === 1 || code === 2) return 'partly-cloudy';
  if (code === 3 || code === 45 || code === 48) return 'cloudy';
  if (code !== undefined && ((code >= 51 && code <= 67) || (code >= 80 && code <= 99))) return 'rain';
  if (code !== undefined && code >= 71 && code <= 77) return 'cloudy';
  return 'mostly-cloudy';
}

export function resolveKnownWeatherLocation(query: string): WeatherResolvedLocation | null {
  const normalized = normalizeLookup(query);
  const known = KNOWN_LOCATIONS.find((entry) => entry.aliases.includes(normalized));
  if (!known) {
    return null;
  }

  return {
    ...known.location,
    name: query.trim() || known.location.name
  };
}

export function buildOpenMeteoGeocodeUrl(query: string): string {
  const url = new URL('https://geocoding-api.open-meteo.com/v1/search');
  url.searchParams.set('name', query);
  url.searchParams.set('count', '1');
  url.searchParams.set('language', 'en');
  url.searchParams.set('format', 'json');
  return url.toString();
}

export function buildOpenMeteoForecastUrl(location: Pick<WeatherResolvedLocation, 'latitude' | 'longitude'>): string {
  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.searchParams.set('latitude', String(Number(location.latitude.toFixed(4))));
  url.searchParams.set('longitude', String(Number(location.longitude.toFixed(4))));
  url.searchParams.set(
    'current',
    'temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,pressure_msl,weather_code'
  );
  url.searchParams.set('hourly', 'temperature_2m,precipitation_probability,weather_code');
  url.searchParams.set(
    'daily',
    'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max'
  );
  url.searchParams.set('forecast_days', '7');
  url.searchParams.set('timezone', 'auto');
  return url.toString();
}

export function pickOpenMeteoGeocodeResult(response: OpenMeteoGeocodeResponse): WeatherResolvedLocation | null {
  const result = response.results?.find(
    (item) => Number.isFinite(item.latitude) && Number.isFinite(item.longitude) && item.name?.trim()
  );

  if (!result || result.latitude === undefined || result.longitude === undefined || !result.name) {
    return null;
  }

  return {
    name: result.name.trim(),
    country: result.country?.trim() || undefined,
    countryCode: result.country_code?.trim() || undefined,
    latitude: result.latitude,
    longitude: result.longitude
  };
}

export function buildWeatherForecastFromOpenMeteo(
  location: WeatherResolvedLocation,
  response: OpenMeteoForecastResponse
): WeatherForecast {
  const current = response.current ?? {};
  const currentTemp = Number.isFinite(current.temperature_2m) ? current.temperature_2m as number : 0;
  const hourlyStart = currentHourlyIndex(response.hourly?.time, current.time);

  const hourly: WeatherHour[] = (response.hourly?.time ?? [])
    .slice(hourlyStart, hourlyStart + 8)
    .map((time, offset) => {
      const index = hourlyStart + offset;
      return {
        time: hourLabel(time),
        condition: weatherCodeToCondition(response.hourly?.weather_code?.[index]),
        temperatureC: numberAt(response.hourly?.temperature_2m, index, currentTemp),
        precipitationChance: roundNumber(numberAt(response.hourly?.precipitation_probability, index, 0))
      };
    });

  const daily: WeatherDay[] = (response.daily?.time ?? []).slice(0, 7).map((date, index) => {
    const weekday = weekdayFromDate(date);
    return {
      date,
      label: weekday.label,
      weekdayIndex: weekday.index,
      condition: weatherCodeToCondition(response.daily?.weather_code?.[index]),
      highC: numberAt(response.daily?.temperature_2m_max, index, currentTemp),
      lowC: numberAt(response.daily?.temperature_2m_min, index, currentTemp),
      precipitationChance: roundNumber(numberAt(response.daily?.precipitation_probability_max, index, 0))
    };
  });

  return {
    location: location.name,
    country: location.country ?? null,
    condition: weatherCodeToCondition(current.weather_code),
    currentTempC: currentTemp,
    feelsLikeC: Number.isFinite(current.apparent_temperature) ? current.apparent_temperature as number : currentTemp,
    humidity: roundNumber(current.relative_humidity_2m ?? 0),
    windKph: roundNumber(current.wind_speed_10m ?? 0),
    pressureHpa: roundNumber(current.pressure_msl ?? 0),
    hourly,
    daily
  };
}
