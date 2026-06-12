export interface InstantAnswer {
  name: string;
  url: string;
  icon: string;
  description: string;
  aliases: string[];
}

/** Shape of the JSON dataset served from /instant-answers.json. */
export interface InstantAnswersData {
  sites: InstantAnswer[];
}

/** Default cap for the number of suggestions returned. */
export const INSTANT_ANSWERS_LIMIT = 6;

/**
 * Build a favicon image URL for a site by asking the site (via Google's public
 * favicon service) for its real icon. Returns `null` when the URL can't be
 * parsed so callers can fall back to the emoji icon.
 */
export function faviconUrl(siteUrl: string, size = 64): string | null {
  try {
    const { hostname } = new URL(siteUrl);
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(hostname)}&sz=${size}`;
  } catch {
    return null;
  }
}

/** Lower-case and strip all whitespace so "git hub" matches "github". */
function normalize(value: string): string {
  return value.toLowerCase().replace(/\s+/g, '');
}

/**
 * Find instant-answer sites matching a query.
 *
 * Matching is case-insensitive and whitespace-insensitive and considers both
 * the site `name` and its `aliases` (including Russian aliases). Results are
 * ranked so that prefix matches come before plain substring matches, then
 * alphabetically by name, and capped at `limit`. An empty or whitespace-only
 * query returns an empty array.
 */
export function findInstantAnswers(
  query: string,
  sites: InstantAnswer[],
  limit: number = INSTANT_ANSWERS_LIMIT
): InstantAnswer[] {
  const needle = normalize(query);
  if (!needle) {
    return [];
  }

  const matches: { site: InstantAnswer; score: number }[] = [];

  for (const site of sites) {
    const haystacks = [site.name, ...site.aliases].map(normalize);

    let score = Infinity;
    for (const haystack of haystacks) {
      if (haystack.startsWith(needle)) {
        score = Math.min(score, 0);
      } else if (haystack.includes(needle)) {
        score = Math.min(score, 1);
      }
    }

    if (score !== Infinity) {
      matches.push({ site, score });
    }
  }

  matches.sort((a, b) => a.score - b.score || a.site.name.localeCompare(b.site.name));

  return matches.slice(0, limit).map((entry) => entry.site);
}
