import { R as derived, U as store_get, V as unsubscribe_stores } from './exports-CoBtNwQi.js';
import { r as resolvePublicRuntimeConfig } from './public-config-CCusQZMd.js';
import { p as page } from './state-D5a0yXnN.js';
import { g as getLocaleText, k as kefineLocale } from './kefine-locale-Dc0dhHaI.js';
import { L as LegalPage, g as getLegalPageContent } from './legal-content-ugdNmPle.js';
import './index-DyD4Z1FP.js';
import 'node:module';

//#region src/routes/terms/+page.svelte
function _page($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		var $$store_subs;
		const localeText = derived(() => getLocaleText(store_get($$store_subs ??= {}, "$kefineLocale", kefineLocale)));
		const runtimeConfig = derived(() => resolvePublicRuntimeConfig(page.data.publicConfig));
		const content = derived(() => getLegalPageContent(store_get($$store_subs ??= {}, "$kefineLocale", kefineLocale), "terms", runtimeConfig().company, runtimeConfig().app.legalUpdatedAt[store_get($$store_subs ??= {}, "$kefineLocale", kefineLocale)]));
		const relatedLinks = derived(() => [{
			id: "privacy",
			label: localeText().topbar.legalLinks.privacy,
			href: "/privacy"
		}, {
			id: "company",
			label: localeText().topbar.legalLinks.company,
			href: "/legal-information"
		}]);
		LegalPage($$renderer, {
			content: content(),
			relatedLinks: relatedLinks(),
			backLabel: localeText().topbar.legalLinks.backToApp,
			backHref: "/",
			relatedLabel: localeText().topbar.legalLinks.related,
			updatedLabel: localeText().topbar.legalLinks.updated
		});
		if ($$store_subs) unsubscribe_stores($$store_subs);
	});
}

export { _page as default };
//# sourceMappingURL=_page.svelte-B4huFRXj.js.map
