import type { RequestHandler } from './$types';
import { proxyCraterRequest } from '$lib/server/crater-proxy';

export const POST: RequestHandler = ({ request, fetch }) =>
	proxyCraterRequest(request, fetch, '/auth/wallet/browser', {
		errorMessage: 'Failed to reach wallet browser auth.'
	});
