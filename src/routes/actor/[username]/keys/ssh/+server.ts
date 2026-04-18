import { proxyCraterRequest } from '$lib/server/crater-proxy';
import type { RequestHandler } from './$types';

function buildPath(username: string): string {
  return `actor/${encodeURIComponent(username)}/keys/ssh`;
}

export const GET: RequestHandler = async ({ params, request, fetch }) =>
  proxyCraterRequest(request, fetch, buildPath(params.username), {
    errorMessage: 'Failed to load SSH key.'
  });

export const PUT: RequestHandler = async ({ params, request, fetch }) =>
  proxyCraterRequest(request, fetch, buildPath(params.username), {
    errorMessage: 'Failed to save SSH key.'
  });

export const DELETE: RequestHandler = async ({ params, request, fetch }) =>
  proxyCraterRequest(request, fetch, buildPath(params.username), {
    errorMessage: 'Failed to delete SSH key.'
  });
