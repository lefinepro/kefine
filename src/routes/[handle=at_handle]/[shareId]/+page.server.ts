import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getPublicRuntimeConfig } from '$lib/server/kefine-config';

export const load: PageServerLoad = async ({ params, fetch }) => {
  const runtimeConfig = getPublicRuntimeConfig();
  const normalizedHandle = params.handle?.replace(/^@+/, '').trim().toLowerCase();
  const defaultActorHandle = runtimeConfig.defaultActor.handle.trim().toLowerCase();

  if (normalizedHandle !== defaultActorHandle || !params.shareId?.trim()) {
    return {};
  }

  const response = await fetch(
    `/api/services/${encodeURIComponent(params.shareId)}`
  ).catch(() => null);

  if (response?.ok) {
    throw redirect(308, `/services/${encodeURIComponent(params.shareId)}`);
  }

  return {};
};
