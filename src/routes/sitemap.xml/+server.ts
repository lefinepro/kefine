import type { RequestHandler } from './$types';
import { getKefineConfig } from '$lib/server/kefine-config';

const INDEXABLE_ROUTES = ['/', '/privacy', '/terms', '/legal-information'] as const;

function resolveBaseUrl(url: URL): string {
  return getKefineConfig().origins.primary.trim() || url.origin;
}

export const GET: RequestHandler = ({ url }) => {
  const baseUrl = resolveBaseUrl(url).replace(/\/+$/, '');
  const lastmod = new Date().toISOString();

  const entries = INDEXABLE_ROUTES.map((pathname) => {
    const href = pathname === '/' ? baseUrl : `${baseUrl}${pathname}`;

    return [
      '<url>',
      `  <loc>${href}</loc>`,
      `  <lastmod>${lastmod}</lastmod>`,
      `  <changefreq>${pathname === '/' ? 'daily' : 'monthly'}</changefreq>`,
      `  <priority>${pathname === '/' ? '1.0' : '0.5'}</priority>`,
      '</url>'
    ].join('\n');
  }).join('\n');

  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    entries,
    '</urlset>'
  ].join('\n');

  return new Response(body, {
    headers: {
      'content-type': 'application/xml; charset=utf-8',
      'cache-control': 'public, max-age=3600'
    }
  });
};
