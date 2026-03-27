import type { RequestHandler } from './$types';
import { proxyCraterRequest } from '$lib/server/crater-proxy';

export const POST: RequestHandler = async ({ request, fetch }) =>
  proxyCraterRequest(request, fetch, '/passkeys/authenticate/finish', {
    errorMessage: 'Failed to finish passkey authentication in crater.'
  });
