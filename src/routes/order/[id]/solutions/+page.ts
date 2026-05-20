import type { PageLoad } from './$types';

export const prerender = false;

export const load: PageLoad = ({ params, url }) => {
  return {
    orderId: params.id,
    taskText: url.searchParams.get('task') ?? ''
  };
};
