import { proxyCraterRequest } from '$lib/server/crater-proxy';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = ({ request, fetch }) =>
  proxyCraterRequest(request, fetch, '/api/bot/create', {
    errorMessage: 'Failed to reach Lepos bot endpoint.',
    forwardAuthorization: true
  });
