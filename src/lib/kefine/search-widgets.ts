/**
 * Built-in widgets the command palette can surface inline on any page and that
 * are reachable through per-profile short links such as `/@profile/weather`.
 */
export type KefineSearchWidgetId = 'weather' | 'clock' | 'translate' | 'music' | 'proxy';

/** Canonical widget ids in their display order. */
export const KEFINE_SEARCH_WIDGET_IDS: readonly KefineSearchWidgetId[] = [
  'weather',
  'clock',
  'translate',
  'music',
  'proxy'
];

/**
 * Slug aliases accepted in short-link URLs. Several human-friendly spellings map
 * onto the same canonical widget id so links like `/@profile/forecast` or
 * `/@profile/translator` keep working.
 */
const WIDGET_SLUG_ALIASES: Readonly<Record<string, KefineSearchWidgetId>> = {
  weather: 'weather',
  forecast: 'weather',
  clock: 'clock',
  time: 'clock',
  translate: 'translate',
  translator: 'translate',
  translation: 'translate',
  music: 'music',
  track: 'music',
  proxy: 'proxy',
  vpn: 'proxy'
};

/**
 * Resolve a URL slug to its canonical widget id, or `null` when the slug does
 * not name a known widget.
 */
export function normalizeSearchWidgetId(slug: string | null | undefined): KefineSearchWidgetId | null {
  if (!slug) {
    return null;
  }

  return WIDGET_SLUG_ALIASES[slug.trim().toLowerCase()] ?? null;
}

/** Whether a URL slug names a known widget short link. */
export function isSearchWidgetSlug(slug: string | null | undefined): boolean {
  return normalizeSearchWidgetId(slug) !== null;
}
