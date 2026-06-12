import { isSearchWidgetSlug } from '$lib/kefine/widgets/search-widgets';

export function match(param: string): boolean {
  return isSearchWidgetSlug(param);
}
