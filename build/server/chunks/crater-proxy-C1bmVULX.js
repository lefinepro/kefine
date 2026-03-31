import { b as buildCraterApiUrl } from './crater-api-BBflsIA0.js';
import { j as json } from './index-DQ9ujr7S.js';

//#region src/lib/server/crater-proxy.ts
async function proxyCraterRequest(request, fetchFn, pathname, options) {
	try {
		const body = request.method === "GET" || request.method === "HEAD" ? void 0 : new Uint8Array(await request.arrayBuffer());
		const response = await fetchFn(buildCraterApiUrl(pathname), {
			method: request.method,
			headers: {
				Accept: request.headers.get("accept") ?? "application/json",
				...body !== void 0 ? { "Content-Type": request.headers.get("content-type") ?? "application/json" } : {}
			},
			body
		});
		const payload = await response.text();
		const contentType = response.headers.get("content-type") ?? "application/json";
		if (!response.ok && !contentType.toLowerCase().includes("application/json")) return json({ error: payload.replace(/\s+/g, " ").trim() || response.statusText || options.errorMessage }, { status: response.status });
		return new Response(payload, {
			status: response.status,
			headers: { "content-type": contentType }
		});
	} catch (error) {
		return json({
			error: error instanceof Error ? error.message : options.errorMessage,
			...options.context
		}, { status: 502 });
	}
}

export { proxyCraterRequest as p };
//# sourceMappingURL=crater-proxy-C1bmVULX.js.map
