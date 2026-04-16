import { proxyCraterRequest } from '$lib/server/crater-proxy';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ request, fetch }) =>
  proxyCraterRequest(request, fetch, '/health', {
    errorMessage: 'Failed to reach crater health endpoint.'
  });
