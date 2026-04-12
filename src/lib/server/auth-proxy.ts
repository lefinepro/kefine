import { proxyCraterRequest } from '$lib/server/crater-proxy';

export async function proxyPrivateKeyAuth(request: Request, fetchFn: typeof fetch): Promise<Response> {
  return proxyCraterRequest(request, fetchFn, '/auth', {
    errorMessage: 'Failed to reach publickey auth.'
  });
}
