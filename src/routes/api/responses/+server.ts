import { proxyCraterRequest } from '$lib/server/crater/crater-proxy';
import type { RequestHandler } from './$types';

// The solver return path. A local solver service processes the message relayed
// to its inbox, runs inference (OpenAI for the initial provider), and POSTs the
// result here authenticated with its bearer token. The crater backend owns the
// processing layer; this route just forwards the request, Authorization header
// included.
export const POST: RequestHandler = ({ request, fetch }) =>
  proxyCraterRequest(request, fetch, '/api/responses', {
    errorMessage: 'Failed to reach Lepos solver responses endpoint.'
  });
