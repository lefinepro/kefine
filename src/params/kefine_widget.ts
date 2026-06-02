import { isSearchWidgetSlug } from '$lib/kefine/search-widgets';

export function match(param: string): boolean {
  return isSearchWidgetSlug(param);
}
