import type { RequestHandler } from './$types';
import { proxyCraterRequest } from '$lib/server/crater-proxy';

export const POST: RequestHandler = async ({ request, fetch }) =>
  proxyCraterRequest(request, fetch, '/passkeys/register/start', {
    errorMessage: 'Failed to start passkey registration in crater.'
  });
