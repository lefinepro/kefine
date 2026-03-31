import { a as proxyOrderStatus } from './order-proxy-BWRu83gC.js';
import './crater-proxy-C1bmVULX.js';
import './crater-api-BBflsIA0.js';
import './kefine-config-CR01Iob0.js';
import './public-config-CCusQZMd.js';
import 'node:fs';
import 'node:path';
import './index-DQ9ujr7S.js';
import './index-DyD4Z1FP.js';

//#region src/routes/api/kefine/orders/status/[id]/+server.ts
var GET = async ({ params, fetch, url }) => proxyOrderStatus(new Request(url, { method: "GET" }), `/status/${encodeURIComponent(params.id)}`, fetch, params.id);

export { GET };
//# sourceMappingURL=_server.ts-CfYP9zvM.js.map
