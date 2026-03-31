import { b as buildCraterApiUrl } from './crater-api-BBflsIA0.js';
import { r as redirect } from './index-DQ9ujr7S.js';
import './kefine-config-CR01Iob0.js';
import './public-config-CCusQZMd.js';
import 'node:fs';
import 'node:path';
import './index-DyD4Z1FP.js';

//#region src/routes/pay/[id]/+server.ts
var GET = async ({ params }) => {
	redirect(307, buildCraterApiUrl(`/pay/${encodeURIComponent(params.id)}`));
};

export { GET };
//# sourceMappingURL=_server.ts-BnAIKbQi.js.map
