/**
 * Lightweight clock / time widget logic. Mirrors the structure of
 * `weather-intent`/`weather-forecast` so the topbar palette, per-profile short
 * links (`/@profile/time`) and the Org-format profile widget blocks can all
 * surface a live local-or-named clock without a network round-trip.
 *
 * The detector stays local so the composer can react while the user is still
 * typing, and timezone resolution leans on the platform `Intl` database with a
 * small alias table for the most common spellings (including Russian and
 * Armenian) so prompts like "time in Tokyo" or "который час в Минске" resolve.
 */

const CLOCK_WORDS: readonly string[] = [
  'time',
  'clock',
  'time zone',
  'timezone',
  'время',
  'часы',
  'который час',
  'ժամ',
  'ժամը',
  'ժամանակ'
];

const LOCATION_PATTERNS: readonly RegExp[] = [
  /(?:^|[^\p{L}\p{N}])(?:time|clock)[\s,:-]*(?:in|for|at|near)?[\s,:-]*(?<location>[\p{L}\p{M}\p{N}][\p{L}\p{M}\p{N}\s.'-]{0,63})/iu,
  /(?:^|[^\p{L}\p{N}])(?:который\s+час|время|часы)[\s,:-]*(?:в|во|для|на)?[\s,:-]*(?<location>[\p{L}\p{M}\p{N}][\p{L}\p{M}\p{N}\s.'-]{0,63})/iu,
  /(?:^|[^\p{L}\p{N}])(?:ժամը|ժամ|ժամանակ)[\s,:-]*(?:ում|համար)?[\s,:-]*(?<location>[\p{L}\p{M}\p{N}][\p{L}\p{M}\p{N}\s.'-]{0,63})/iu,
  /(?:^|[^\p{L}\p{N}])(?<location>[\p{L}\p{M}\p{N}][\p{L}\p{M}\p{N}\s.'-]{1,42})[\s,:-]+(?:time|clock)(?:$|[^\p{L}\p{N}])/iu
];

const TRAILING_FILLER =
  /(?:[\s,;:!?()[\]{}'"-]+(?:today|tomorrow|now|please|pls|right\s+now|сейчас|пожалуйста|հիմա))+$/iu;
const FILLER_ONLY =
  /^(?:today|tomorrow|now|please|pls|сейчас|пожалуйста|հիմա)$/iu;

/** A city alias mapped onto an IANA timezone and its display name. */
interface KnownTimeZone {
  aliases: readonly string[];
  name: string;
  timeZone: string;
}

const KNOWN_TIMEZONES: readonly KnownTimeZone[] = [
  { aliases: ['gomel', 'homel', 'гомель'], name: 'Gomel', timeZone: 'Europe/Minsk' },
  { aliases: ['minsk', 'минск', 'мінск'], name: 'Minsk', timeZone: 'Europe/Minsk' },
  { aliases: ['moscow', 'москва', 'москве'], name: 'Moscow', timeZone: 'Europe/Moscow' },
  { aliases: ['yerevan', 'ереван', 'երևան', 'երեւան'], name: 'Yerevan', timeZone: 'Asia/Yerevan' },
  { aliases: ['london', 'лондон'], name: 'London', timeZone: 'Europe/London' },
  { aliases: ['paris', 'париж'], name: 'Paris', timeZone: 'Europe/Paris' },
  { aliases: ['berlin', 'берлин'], name: 'Berlin', timeZone: 'Europe/Berlin' },
  { aliases: ['new york', 'newyork', 'нью-йорк', 'нью йорк'], name: 'New York', timeZone: 'America/New_York' },
  { aliases: ['los angeles', 'losangeles', 'la', 'лос-анджелес'], name: 'Los Angeles', timeZone: 'America/Los_Angeles' },
  { aliases: ['tokyo', 'токио'], name: 'Tokyo', timeZone: 'Asia/Tokyo' },
  { aliases: ['dubai', 'дубай'], name: 'Dubai', timeZone: 'Asia/Dubai' },
  { aliases: ['singapore', 'сингапур'], name: 'Singapore', timeZone: 'Asia/Singapore' },
  { aliases: ['sydney', 'сидней'], name: 'Sydney', timeZone: 'Australia/Sydney' },
  { aliases: ['utc', 'gmt'], name: 'UTC', timeZone: 'UTC' }
];

export type ClockTarget =
  | { kind: 'local' }
  | { kind: 'named'; query: string; timeZone: string };

/** A resolved, render-ready clock readout for a given moment and timezone. */
export interface ClockReadout {
  /** Localized `HH:MM` (or `h:MM` for 12-hour locales) without the period. */
  time: string;
  /** Seconds, zero-padded, surfaced separately so the UI can de-emphasise it. */
  seconds: string;
  /** `AM`/`PM` for 12-hour locales, empty for 24-hour locales. */
  period: string;
  /** Localized weekday, e.g. `Monday`. */
  weekday: string;
  /** Localized long date, e.g. `5 June 2026`. */
  date: string;
  /** Short timezone label, e.g. `GMT+4`. */
  zoneLabel: string;
}

function normalizeLookup(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');
}

function escapeForRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

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

  if (!cleaned || FILLER_ONLY.test(cleaned)) {
    return '';
  }

  return titleCaseLocation(cleaned);
}

/** Whether `text` reads like a request to see the time/clock. */
export function detectClockIntent(text: string | null | undefined): boolean {
  if (!text) {
    return false;
  }

  const normalized = ` ${text.toLowerCase().trim()} `;
  if (normalized.trim().length < 3) {
    return false;
  }

  return CLOCK_WORDS.some((word) => containsWord(normalized, word));
}

/** Pull the place out of a clock prompt, e.g. `time in Tokyo` → `Tokyo`. */
export function extractClockLocationQuery(text: string | null | undefined): string | null {
  if (!text) {
    return null;
  }

  for (const pattern of LOCATION_PATTERNS) {
    const match = pattern.exec(text.trim());
    const location = match?.groups?.location ? cleanLocation(match.groups.location) : '';
    if (location) {
      return location;
    }
  }

  return null;
}

/**
 * Resolve a free-typed place to an IANA timezone. Known city aliases win first;
 * otherwise a value that is already a valid IANA zone (e.g. `Asia/Tokyo`) is
 * accepted as-is. Returns `null` when nothing usable is found.
 */
export function resolveClockTimeZone(query: string | null | undefined): string | null {
  if (!query) {
    return null;
  }

  const normalized = normalizeLookup(query);
  if (!normalized) {
    return null;
  }

  const known = KNOWN_TIMEZONES.find((entry) => entry.aliases.includes(normalized));
  if (known) {
    return known.timeZone;
  }

  return isValidTimeZone(query.trim()) ? query.trim() : null;
}

/** Whether the platform `Intl` database accepts `timeZone` as a valid zone. */
export function isValidTimeZone(timeZone: string): boolean {
  if (!timeZone.trim()) {
    return false;
  }

  try {
    new Intl.DateTimeFormat('en-US', { timeZone });
    return true;
  } catch {
    return false;
  }
}

/**
 * Resolve a clock prompt into a target. Bare prompts (`time`, `clock`) read the
 * viewer's local clock; a recognised place yields a named target carrying the
 * resolved IANA timezone.
 */
export function getClockTarget(text: string | null | undefined): ClockTarget | null {
  if (!detectClockIntent(text)) {
    return null;
  }

  const query = extractClockLocationQuery(text);
  if (!query) {
    return { kind: 'local' };
  }

  const timeZone = resolveClockTimeZone(query);
  return timeZone ? { kind: 'named', query, timeZone } : { kind: 'local' };
}

function partValue(parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes): string {
  return parts.find((part) => part.type === type)?.value ?? '';
}

/**
 * Build a render-ready readout for `date`. When `timeZone` is omitted the
 * viewer's local zone is used. `locale` controls 12/24-hour and label language.
 */
export function formatClockReadout(
  date: Date,
  timeZone?: string | null,
  locale = 'en'
): ClockReadout {
  const zone = timeZone && isValidTimeZone(timeZone) ? timeZone : undefined;
  const timeFormatter = new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: zone
  });
  const parts = timeFormatter.formatToParts(date);
  const hour = partValue(parts, 'hour');
  const minute = partValue(parts, 'minute');
  const seconds = partValue(parts, 'second');
  const period = partValue(parts, 'dayPeriod').toLocaleUpperCase();

  const weekday = new Intl.DateTimeFormat(locale, { weekday: 'long', timeZone: zone }).format(date);
  const longDate = new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: zone
  }).format(date);
  const zoneParts = new Intl.DateTimeFormat(locale, {
    timeZoneName: 'short',
    hour: '2-digit',
    timeZone: zone
  }).formatToParts(date);

  return {
    time: `${hour}:${minute}`,
    seconds,
    period,
    weekday,
    date: longDate,
    zoneLabel: partValue(zoneParts, 'timeZoneName')
  };
}
