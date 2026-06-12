import { normalizeSearchWidgetId } from '$lib/kefine/widgets/search-widgets';
import type { PageLoad } from './$types';

export const prerender = false;

export const load: PageLoad = ({ params }) => {
  return {
    initialActorHandle: params.handle,
    initialWidget: normalizeSearchWidgetId(params.widget)
  };
};
