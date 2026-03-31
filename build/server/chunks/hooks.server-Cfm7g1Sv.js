import { g as getKefineConfig } from './kefine-config-CR01Iob0.js';
import { r as redirect } from './index-DQ9ujr7S.js';
import './public-config-CCusQZMd.js';
import 'node:fs';
import 'node:path';
import './index-DyD4Z1FP.js';

//#region src/lib/server/domain-routing.ts
var LOCAL_HOSTS = new Set([
	"localhost",
	"127.0.0.1",
	"::1"
]);
function parseOrigin(value) {
	const normalized = value?.trim();
	if (!normalized) return null;
	try {
		return new URL(normalized);
	} catch {
		return null;
	}
}
function isLocalHost(hostname) {
	return LOCAL_HOSTS.has(hostname);
}
function normalizePathname(pathname) {
	if (pathname === "/") return pathname;
	return pathname.replace(/\/+$/, "");
}
function getDomainBucket(pathname) {
	const normalizedPath = normalizePathname(pathname);
	if (normalizedPath === "/privacy" || normalizedPath === "/terms" || normalizedPath === "/legal-information" || normalizedPath === "/refund-policy") return "legal";
	if (normalizedPath === "/create" || normalizedPath.startsWith("/task/") || normalizedPath.startsWith("/order/") || normalizedPath.startsWith("/payment/") || normalizedPath.startsWith("/pay/") || normalizedPath.startsWith("/passkeys/") || normalizedPath === "/status" || normalizedPath.startsWith("/status/") || normalizedPath.startsWith("/api/kefine/")) return "task";
	return "primary";
}
function getConfiguredOrigins() {
	const { origins } = getKefineConfig();
	const primaryOrigin = parseOrigin(origins.primary);
	return {
		primaryOrigin,
		legalOrigin: parseOrigin(origins.legal) ?? primaryOrigin,
		taskOrigin: parseOrigin(origins.task) ?? primaryOrigin
	};
}
function resolveDomainRedirect(url) {
	if (isLocalHost(url.hostname)) return null;
	const config = getConfiguredOrigins();
	const bucket = getDomainBucket(url.pathname);
	const targetOrigin = bucket === "legal" ? config.legalOrigin : bucket === "task" ? config.taskOrigin : config.primaryOrigin;
	if (!targetOrigin) return null;
	if (targetOrigin.origin === url.origin) return null;
	return new URL(url.pathname + url.search, targetOrigin);
}
//#endregion
//#region src/hooks.server.ts
var REDIRECTABLE_METHODS = new Set(["GET", "HEAD"]);
var handle = async ({ event, resolve }) => {
	if (REDIRECTABLE_METHODS.has(event.request.method)) {
		const redirectUrl = resolveDomainRedirect(event.url);
		if (redirectUrl) redirect(308, redirectUrl.toString());
	}
	return resolve(event);
};

export { handle };
//# sourceMappingURL=hooks.server-Cfm7g1Sv.js.map
