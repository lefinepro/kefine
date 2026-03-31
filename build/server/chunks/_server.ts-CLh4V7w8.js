import { g as getKefineConfig } from './kefine-config-CR01Iob0.js';
import './public-config-CCusQZMd.js';
import 'node:fs';
import 'node:path';

//#region src/routes/robots.txt/+server.ts
function resolveBaseUrl(url) {
	return getKefineConfig().origins.primary.trim() || url.origin;
}
var GET = ({ url }) => {
	const body = [
		"User-agent: *",
		"Allow: /",
		"Disallow: /api/",
		"Disallow: /status",
		"Disallow: /status/",
		"Disallow: /payment/",
		"Disallow: /pay/",
		"Disallow: /task/",
		"Disallow: /order/",
		"Disallow: /passkeys/",
		`Sitemap: ${resolveBaseUrl(url)}/sitemap.xml`
	].join("\n");
	return new Response(body, { headers: {
		"content-type": "text/plain; charset=utf-8",
		"cache-control": "public, max-age=3600"
	} });
};

export { GET };
//# sourceMappingURL=_server.ts-CLh4V7w8.js.map
