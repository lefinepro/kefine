import { a as proxyOrderStatus } from './order-proxy-BWRu83gC.js';
import './crater-proxy-C1bmVULX.js';
import './crater-api-BBflsIA0.js';
import './kefine-config-CR01Iob0.js';
import './public-config-CCusQZMd.js';
import 'node:fs';
import 'node:path';
import './index-DQ9ujr7S.js';
import './index-DyD4Z1FP.js';

//#region src/routes/status/+server.ts
var GET = async ({ url, fetch }) => {
	const orderId = url.searchParams.get("id") ?? url.searchParams.get("orderId");
	const query = orderId ? `?id=${encodeURIComponent(orderId)}` : "";
	return proxyOrderStatus(new Request(url, { method: "GET" }), `/status${query}`, fetch, orderId ?? void 0);
};

export { GET };
//# sourceMappingURL=_server.ts-D36-9-ER.js.map
