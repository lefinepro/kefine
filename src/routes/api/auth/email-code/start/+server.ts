import type { RequestHandler } from './$types';
import { proxyCraterRequest } from '$lib/server/crater-proxy';

export const POST: RequestHandler = ({ request, fetch }) =>
	proxyCraterRequest(request, fetch, '/auth/email-code/start', {
		errorMessage: 'Failed to reach email code start.'
	});
