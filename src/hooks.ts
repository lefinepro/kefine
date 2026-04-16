import type { Reroute } from '@sveltejs/kit';
import { stripLocalePrefix } from '$lib/routing/kefine-locale-routing';

export const reroute: Reroute = ({ url }) => {
  return stripLocalePrefix(url.pathname);
};
