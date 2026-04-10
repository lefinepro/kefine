import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getPublicRuntimeConfig } from '$lib/server/kefine-config';

export const load: PageServerLoad = async ({ params, fetch }) => {
  const runtimeConfig = getPublicRuntimeConfig();
  const normalizedHandle = params.handle?.replace(/^@+/, '').trim().toLowerCase();
  const defaultActorHandle = runtimeConfig.defaultActor.handle.trim().toLowerCase();

  if (normalizedHandle !== defaultActorHandle || !params.slug?.trim()) {
    return {};
  }

  const response = await fetch(
    `/api/kefine/templates/${encodeURIComponent(defaultActorHandle)}/${encodeURIComponent(params.slug)}`
  ).catch(() => null);

  if (response?.ok) {
    throw redirect(308, `/${encodeURIComponent(params.slug)}`);
  }

  return {};
};
