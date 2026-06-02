import { writable } from 'svelte/store';
import type { KefineTopbarIconName } from '$lib/components/kefine/KefineTopbarIcon.svelte';

export type TopbarSearchAction = {
  id: string;
  label: string;
  icon: KefineTopbarIconName;
  testId?: string;
  onClick: () => void | Promise<void>;
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
