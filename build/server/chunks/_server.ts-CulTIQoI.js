import { g as getKefineConfig } from './kefine-config-CR01Iob0.js';
import './public-config-CCusQZMd.js';
import 'node:fs';
import 'node:path';

//#region src/routes/sitemap.xml/+server.ts
var INDEXABLE_ROUTES = [
	"/",
	"/privacy",
	"/terms",
	"/legal-information"
];
function resolveBaseUrl(url) {
	return getKefineConfig().origins.primary.trim() || url.origin;
}
var GET = ({ url }) => {
	const baseUrl = resolveBaseUrl(url).replace(/\/+$/, "");
	const lastmod = (/* @__PURE__ */ new Date()).toISOString();
	const body = [
		"<?xml version=\"1.0\" encoding=\"UTF-8\"?>",
		"<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">",
		INDEXABLE_ROUTES.map((pathname) => {
			return [
				"<url>",
				`  <loc>${pathname === "/" ? baseUrl : `${baseUrl}${pathname}`}</loc>`,
				`  <lastmod>${lastmod}</lastmod>`,
				`  <changefreq>${pathname === "/" ? "daily" : "monthly"}</changefreq>`,
				`  <priority>${pathname === "/" ? "1.0" : "0.5"}</priority>`,
				"</url>"
			].join("\n");
		}).join("\n"),
		"</urlset>"
	].join("\n");
	return new Response(body, { headers: {
		"content-type": "application/xml; charset=utf-8",
		"cache-control": "public, max-age=3600"
	} });
};

export { GET };
//# sourceMappingURL=_server.ts-CulTIQoI.js.map
