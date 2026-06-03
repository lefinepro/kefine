import type { PageLoad } from './$types';

export const prerender = false;

export const load: PageLoad = ({ params, url }) => {
  return {
    initialActorHandle: params.handle,
    initialOrderId: params.shareId,
    taskText: url.searchParams.get('task') ?? ''
  };
};
