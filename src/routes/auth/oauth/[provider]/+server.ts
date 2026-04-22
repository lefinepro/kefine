import { error, redirect } from '@sveltejs/kit';
import { buildCraterApiUrl } from '$lib/server/crater-api';
import type { RequestHandler } from './$types';

const SUPPORTED_PROVIDERS = new Set(['google', 'github']);

export const GET: RequestHandler = ({ params, url }) => {
  if (!SUPPORTED_PROVIDERS.has(params.provider)) {
    throw error(404, 'OAuth provider not found.');
  }

  const craterUrl = new URL(buildCraterApiUrl(`/auth/oauth/${params.provider}/start`));
  url.searchParams.forEach((value, key) => {
    craterUrl.searchParams.set(key, value);
  });

  throw redirect(302, craterUrl.toString());
};
