import { proxyCraterRequest } from '$lib/server/crater-proxy';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, fetch, params }) => {
  return proxyCraterRequest(
    request,
    fetch,
    `/passkeys/${encodeURIComponent(params.flow)}/${encodeURIComponent(params.step)}`,
    {
      errorMessage: 'Failed to reach passkey auth.'
    }
  );
};
