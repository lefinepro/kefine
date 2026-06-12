import { writable } from 'svelte/store';
import type { KefineTopbarIconName } from '$lib/components/kefine/KefineTopbarIcon.svelte';
import type { KefineSearchWidgetId } from '$lib/kefine/widgets/search-widgets';

export type TopbarSearchAction = {
  id: string;
  label: string;
  icon: KefineTopbarIconName;
  testId?: string;
  onClick: () => void | Promise<void>;
};

export type TopbarSearchItem = {
  id: string;
  title: string;
  subtitle?: string;
  category?: string;
  href?: string;
  actionLabel?: string;
  icon?: KefineTopbarIconName;
  keywords?: string[];
  widget?: KefineSearchWidgetId;
  hideWhenEmpty?: boolean;
  showForQuery?: (query: string) => boolean;
  hrefFromQuery?: (query: string) => string;
  subtitleFromQuery?: (query: string) => string;
};

export type TopbarSearchRequest = {
  id: number;
  query?: string;
  widget?: KefineSearchWidgetId | null;
};

/**
 * Optional override for the shared topbar's search placeholder.
 *
 * Routes that render through the shared layout topbar (see `+layout.svelte`)
 * can set this to surface contextual information in the search bar — for
 * example the solvers screen puts the active repository name here so the
 * header search box reads `@kefine/go-proxy` instead of the generic prompt.
 *
 * Set to `null` to fall back to the default localized placeholder.
 */
export const topbarSearchPlaceholderOverride = writable<string | null>(null);

/**
 * Optional route-scoped icon actions rendered beside the shared topbar search.
 */
export const topbarSearchActions = writable<TopbarSearchAction[]>([]);

/**
 * Optional route-scoped command-palette results.
 */
export const topbarSearchItems = writable<TopbarSearchItem[]>([]);

/**
 * Route-scoped requests to open the shared command palette with a seeded query.
 */
export const topbarSearchRequest = writable<TopbarSearchRequest | null>(null);

let nextTopbarSearchRequestId = 1;

export function requestTopbarSearch(options: Omit<TopbarSearchRequest, 'id'> = {}) {
  topbarSearchRequest.set({
    id: nextTopbarSearchRequestId++,
    ...options
  });
}
