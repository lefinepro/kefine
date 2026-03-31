import { a as getPublicRuntimeConfig } from './kefine-config-CR01Iob0.js';
import './public-config-CCusQZMd.js';
import 'node:fs';
import 'node:path';

//#region src/routes/+layout.ts
var prerender = false;

var _layout_ts = /*#__PURE__*/Object.freeze({
	__proto__: null,
	prerender: prerender
});

//#region src/routes/+layout.server.ts
var load = () => {
	return { publicConfig: getPublicRuntimeConfig() };
};

var _layout_server_ts = /*#__PURE__*/Object.freeze({
	__proto__: null,
	load: load
});

const index = 0;
let component_cache;
const component = async () => component_cache ??= (await import('./_layout.svelte-BQIcFmCx.js')).default;
const universal_id = "src/routes/+layout.ts";
const server_id = "src/routes/+layout.server.ts";
const imports = ["_app/immutable/nodes/0.D-Hbz7Cf.js","_app/immutable/chunks/BO73DafF.js","_app/immutable/chunks/BfziBT0O.js","_app/immutable/chunks/CserSlnI.js","_app/immutable/chunks/Co55RbUi.js","_app/immutable/chunks/CT0T0Gak.js","_app/immutable/chunks/CayFJ0rE.js"];
const stylesheets = [];
const fonts = [];

export { component, fonts, imports, index, _layout_server_ts as server, server_id, stylesheets, _layout_ts as universal, universal_id };
//# sourceMappingURL=0-Nzfa5AJV.js.map
