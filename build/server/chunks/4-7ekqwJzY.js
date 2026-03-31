//#region src/routes/order/[id]/+page.ts
var prerender = false;
var load = ({ params }) => {
	return { initialOrderId: params.id };
};

var _page_ts = /*#__PURE__*/Object.freeze({
	__proto__: null,
	load: load,
	prerender: prerender
});

const index = 4;
let component_cache;
const component = async () => component_cache ??= (await import('./_page.svelte-7swyMP0k.js')).default;
const universal_id = "src/routes/order/[id]/+page.ts";
const imports = ["_app/immutable/nodes/4.qF2HA1RM.js","_app/immutable/chunks/BO73DafF.js","_app/immutable/chunks/D9woh7Ro.js","_app/immutable/chunks/CserSlnI.js","_app/immutable/chunks/Co55RbUi.js","_app/immutable/chunks/DXb0ZbaM.js","_app/immutable/chunks/BfziBT0O.js","_app/immutable/chunks/CT0T0Gak.js","_app/immutable/chunks/ydM0CHwg.js","_app/immutable/chunks/Bqkj_6Ts.js","_app/immutable/chunks/CayFJ0rE.js","_app/immutable/chunks/D8pWH4gz.js"];
const stylesheets = ["_app/immutable/assets/KefineWorkspace.BDwHvIne.css"];
const fonts = [];

export { component, fonts, imports, index, stylesheets, _page_ts as universal, universal_id };
//# sourceMappingURL=4-7ekqwJzY.js.map
