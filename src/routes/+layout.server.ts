import type { LayoutServerLoad } from './$types';
import { getPublicRuntimeConfig } from '$lib/server/kefine-config';

export const load: LayoutServerLoad = () => {
  return {
    publicConfig: getPublicRuntimeConfig()
  };
};
