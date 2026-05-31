/**
 * Lightweight detector for weather / forecast prompts. It mirrors the other
 * composer intent detectors: cheap, Unicode-aware and deliberately local so the
 * widget can react while the user is still typing.
 */

const WEATHER_WORDS: readonly string[] = [
  'weather',
  'forecast',
  'temperature',
  'погода',
  'погоды',
  'прогноз',
  'температура',
  'температуру',
  'եղանակ',
  'եղանակը',
  'կանխատեսում'
];

const LOCATION_PATTERNS: readonly RegExp[] = [
  /(?:^|[^\p{L}\p{N}])(?:weather|forecast|temperature)[\s,:-]*(?:in|for|at|near)?[\s,:-]*(?<location>[\p{L}\p{M}\p{N}][\p{L}\p{M}\p{N}\s.'-]{1,63})/iu,
  /(?:^|[^\p{L}\p{N}])(?:прогноз)(?:\s+погоды)?[\s,:-]*(?:в|во|для|на)?[\s,:-]*(?<location>[\p{L}\p{M}\p{N}][\p{L}\p{M}\p{N}\s.'-]{1,63})/iu,
  /(?:^|[^\p{L}\p{N}])(?:погода|погоды|температура|температуру)[\s,:-]*(?:в|во|для|на)?[\s,:-]*(?<location>[\p{L}\p{M}\p{N}][\p{L}\p{M}\p{N}\s.'-]{1,63})/iu,
  /(?:^|[^\p{L}\p{N}])(?:եղանակ|եղանակը|կանխատեսում)[\s,:-]*(?:ում|համար)?[\s,:-]*(?<location>[\p{L}\p{M}\p{N}][\p{L}\p{M}\p{N}\s.'-]{1,63})/iu,
  /(?:^|[^\p{L}\p{N}])(?<location>[\p{L}\p{M}\p{N}][\p{L}\p{M}\p{N}\s.'-]{1,42})[\s,:-]+(?:weather|forecast)(?:$|[^\p{L}\p{N}])/iu,
  /(?:^|[^\p{L}\p{N}])(?<location>[\p{L}\p{M}\p{N}][\p{L}\p{M}\p{N}\s.'-]{1,42})[\s,:-]+(?:погода|прогноз)(?:$|[^\p{L}\p{N}])/iu,
  /(?:^|[^\p{L}\p{N}])(?<location>[\p{L}\p{M}\p{N}][\p{L}\p{M}\p{N}\s.'-]{1,42})[\s,:-]+(?:եղանակ|կանխատեսում)(?:$|[^\p{L}\p{N}])/iu
];

const TRAILING_FILLER =
  /(?:[\s,;:!?()[\]{}'"-]+(?:today|tomorrow|now|please|pls|сегодня|завтра|сейчас|пожалуйста))+$/iu;

function escapeForRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Whole-word test that works for Latin, Cyrillic and Armenian. JavaScript `\b`
 * is ASCII-only, so we assert non-letter boundaries manually.
 */
function containsWord(haystack: string, word: string): boolean {
  const pattern = new RegExp(`(?:^|[^\\p{L}\\p{N}])${escapeForRegExp(word)}(?:$|[^\\p{L}\\p{N}])`, 'iu');
  return pattern.test(haystack);
}

function titleCaseLocation(value: string): string {
  return value.replace(/\p{L}[\p{L}\p{M}'-]*/gu, (word) => {
    if (word.length <= 1) {
      return word.toLocaleUpperCase();
    }

    return `${word[0]?.toLocaleUpperCase() ?? ''}${word.slice(1).toLocaleLowerCase()}`;
  });
}

function cleanLocation(value: string): string {
  const cleaned = value
    .replace(TRAILING_FILLER, '')
    .replace(/^[\s,;:!?()[\]{}'"-]+|[\s,;:!?()[\]{}'"-]+$/g, '')
    .replace(/^(?:in|for|at|near|в|во|для|на|ում|համար)\s+/iu, '')
    .replace(/\s+/g, ' ')
    .trim();

  return titleCaseLocation(cleaned);
}

export function detectWeatherIntent(text: string | null | undefined): boolean {
  if (!text) {
    return false;
  }

  const normalized = ` ${text.toLowerCase().trim()} `;
  if (normalized.trim().length < 3) {
    return false;
  }

  return WEATHER_WORDS.some((word) => containsWord(normalized, word));
}

export function extractWeatherLocation(text: string | null | undefined, fallback = 'Gomel'): string {
  if (!text) {
    return fallback;
  }

  for (const pattern of LOCATION_PATTERNS) {
    const match = pattern.exec(text.trim());
    const location = match?.groups?.location ? cleanLocation(match.groups.location) : '';
    if (location) {
      return location;
    }
  }

  return fallback;
}
