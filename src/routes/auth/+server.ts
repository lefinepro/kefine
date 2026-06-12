import { proxyPrivateKeyAuth } from '$lib/server/auth/auth-proxy';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = ({ request, fetch }) => proxyPrivateKeyAuth(request, fetch);
