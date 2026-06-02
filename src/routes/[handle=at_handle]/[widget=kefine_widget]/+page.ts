import { normalizeSearchWidgetId } from '$lib/kefine/search-widgets';
import type { PageLoad } from './$types';

export const prerender = false;

export const load: PageLoad = ({ params }) => {
  return {
    initialActorHandle: params.handle,
    initialWidget: normalizeSearchWidgetId(params.widget)
  };
};
