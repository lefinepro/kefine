import type { RequestHandler } from './$types';
import { proxyCraterRequest } from '$lib/server/crater/crater-proxy';

export const POST: RequestHandler = ({ request, fetch }) =>
	proxyCraterRequest(request, fetch, '/auth/email-code/verify', {
		errorMessage: 'Failed to reach email code verify.'
	});
