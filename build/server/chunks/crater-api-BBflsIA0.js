import { g as getKefineConfig } from './kefine-config-CR01Iob0.js';

//#region src/lib/server/crater-api.ts
function normalizeBaseUrl(value) {
	return value.replace(/\/+$/, "");
}
function resolveCraterBaseUrl() {
	return normalizeBaseUrl(getKefineConfig().backend.craterBaseUrl);
}
function buildCraterApiUrl(pathname) {
	const normalizedPath = pathname.replace(/^\/+/, "");
	return `${resolveCraterBaseUrl()}/${normalizedPath}`;
}

export { buildCraterApiUrl as b };
//# sourceMappingURL=crater-api-BBflsIA0.js.map
