import { S as escape_html } from './exports-CoBtNwQi.js';
import { p as page } from './state-D5a0yXnN.js';
import './index-DyD4Z1FP.js';
import 'node:module';

//#region node_modules/@sveltejs/kit/src/runtime/components/svelte-5/error.svelte
function Error($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		$$renderer.push(`<h1>${escape_html(page.status)}</h1> <p>${escape_html(page.error?.message)}</p>`);
	});
}

export { Error as default };
//# sourceMappingURL=error.svelte-Tlc-eMfr.js.map
