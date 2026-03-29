import { redirect, type Handle } from '@sveltejs/kit';
import { resolveDomainRedirect } from '$lib/server/domain-routing';

const REDIRECTABLE_METHODS = new Set(['GET', 'HEAD']);

export const handle: Handle = async ({ event, resolve }) => {
  if (REDIRECTABLE_METHODS.has(event.request.method)) {
    const redirectUrl = resolveDomainRedirect(event.url);

    if (redirectUrl) {
      redirect(308, redirectUrl.toString());
    }
  }

  return resolve(event);
};
