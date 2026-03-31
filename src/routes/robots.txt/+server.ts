import type { RequestHandler } from './$types';
import { getKefineConfig } from '$lib/server/kefine-config';

function resolveBaseUrl(url: URL): string {
  return getKefineConfig().origins.primary.trim() || url.origin;
}

export const GET: RequestHandler = ({ url }) => {
  const baseUrl = resolveBaseUrl(url);
  const body = [
    'User-agent: *',
    'Allow: /',
    'Disallow: /api/',
    'Disallow: /status',
    'Disallow: /status/',
    'Disallow: /payment/',
    'Disallow: /pay/',
    'Disallow: /task/',
    'Disallow: /order/',
    'Disallow: /passkeys/',
    `Sitemap: ${baseUrl}/sitemap.xml`
  ].join('\n');

  return new Response(body, {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'public, max-age=3600'
    }
  });
};
