import './exports-CoBtNwQi.js';
import { K as KefineWorkspace } from './KefineWorkspace-Cpq922tZ.js';
import './index-DyD4Z1FP.js';
import 'node:module';
import './public-config-CCusQZMd.js';
import './state-D5a0yXnN.js';
import './kefine-locale-Dc0dhHaI.js';
import '@simplewebauthn/browser';

//#region src/routes/order/[id]/+page.svelte
function _page($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { data } = $$props;
		KefineWorkspace($$renderer, { initialOrderId: data.initialOrderId });
	});
}

export { _page as default };
//# sourceMappingURL=_page.svelte-7swyMP0k.js.map
