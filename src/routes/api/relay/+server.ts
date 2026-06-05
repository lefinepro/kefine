import { proxyCraterRequest } from '$lib/server/crater-proxy';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ request, fetch }) =>
  proxyCraterRequest(request, fetch, '/api/relay', {
    errorMessage: 'Failed to reach Lepos relay endpoint.'
  });
