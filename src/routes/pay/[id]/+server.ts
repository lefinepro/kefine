import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { buildCraterApiUrl } from '$lib/server/crater-api';

export const GET: RequestHandler = async ({ params }) => {
  redirect(307, buildCraterApiUrl(`/pay/${encodeURIComponent(params.id)}`));
};
