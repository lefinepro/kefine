import { P as head, Q as attr, R as derived } from './exports-CoBtNwQi.js';
import { D as DEFAULT_PUBLIC_RUNTIME_CONFIG, r as resolvePublicRuntimeConfig } from './public-config-CCusQZMd.js';
import { p as page } from './state-D5a0yXnN.js';
import './index-DyD4Z1FP.js';
import 'node:module';

//#region src/lib/seo.ts
var DEFAULT_TITLE = "Lefine | Automated Freelance Exchange";
var DEFAULT_DESCRIPTION = "Lefine routes freelance tasks through solver workflows, payments, and secure digital delivery from a single interface.";
var DEFAULT_IMAGE_PATH = "/og-card.svg";
function resolveLegalMeta(pathname) {
	if (pathname === "/privacy") return {
		id: "privacy",
		title: "Privacy Policy | Lefine",
		description: "Read how Lefine collects, uses, stores, and protects personal data across tasks, payments, and authentication."
	};
	if (pathname === "/terms") return {
		id: "terms",
		title: "Terms of Service | Lefine",
		description: "Review the legal terms for using Lefine, including task creation, solver workflows, payments, and digital delivery."
	};
	if (pathname === "/legal-information") return {
		id: "company",
		title: "Legal Information | Lefine",
		description: "Review Lefine company details, contact information, payment disclosures, and legal notices."
	};
	return null;
}
function buildOrganizationJsonLd(origin, publicConfig) {
	return {
		"@context": "https://schema.org",
		"@type": "Organization",
		name: publicConfig.company.legalName || publicConfig.app.name,
		url: origin,
		logo: `${origin}/favicon.png`,
		contactPoint: {
			"@type": "ContactPoint",
			contactType: "customer support",
			email: publicConfig.company.email || publicConfig.app.supportEmail
		}
	};
}
function getSeoMeta(url, sourceConfig = DEFAULT_PUBLIC_RUNTIME_CONFIG) {
	const pathname = url.pathname.replace(/\/+$/, "") || "/";
	const publicConfig = resolvePublicRuntimeConfig(sourceConfig);
	const legalMeta = resolveLegalMeta(pathname);
	if (legalMeta) return {
		title: legalMeta.title,
		description: legalMeta.description,
		robots: "index,follow,max-image-preview:large",
		canonicalPath: pathname,
		imagePath: DEFAULT_IMAGE_PATH,
		type: "article",
		jsonLd: {
			"@context": "https://schema.org",
			"@type": "WebPage",
			name: legalMeta.title,
			description: legalMeta.description,
			url: `${url.origin}${pathname}`,
			isPartOf: {
				"@type": "WebSite",
				name: publicConfig.app.name,
				url: url.origin
			}
		}
	};
	if (pathname === "/create" || pathname.startsWith("/task/") || pathname.startsWith("/order/") || pathname.startsWith("/payment/") || pathname.startsWith("/pay/") || pathname === "/status" || pathname.startsWith("/status/") || pathname.startsWith("/passkeys/") || pathname.startsWith("/api/kefine/")) return {
		title: DEFAULT_TITLE,
		description: DEFAULT_DESCRIPTION,
		robots: "noindex,nofollow",
		canonicalPath: pathname,
		imagePath: DEFAULT_IMAGE_PATH,
		type: "website",
		jsonLd: buildOrganizationJsonLd(url.origin, publicConfig)
	};
	return {
		title: DEFAULT_TITLE,
		description: DEFAULT_DESCRIPTION,
		robots: "index,follow,max-image-preview:large",
		canonicalPath: "/",
		imagePath: DEFAULT_IMAGE_PATH,
		type: "website",
		jsonLd: {
			"@context": "https://schema.org",
			"@type": "WebSite",
			name: publicConfig.app.name,
			description: DEFAULT_DESCRIPTION,
			url: url.origin,
			publisher: buildOrganizationJsonLd(url.origin, publicConfig)
		}
	};
}
//#endregion
//#region src/routes/+layout.svelte
function _layout($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		const { children, data } = $$props;
		const publicConfig = derived(() => resolvePublicRuntimeConfig(data.publicConfig));
		const seo = derived(() => getSeoMeta(page.url, publicConfig()));
		const canonicalUrl = derived(() => `${page.url.origin}${seo().canonicalPath}`);
		const imageUrl = derived(() => `${page.url.origin}${seo().imagePath}`);
		head("12qhfyh", $$renderer, ($$renderer) => {
			$$renderer.push(`<meta name="description"${attr("content", seo().description)}/> <meta name="robots"${attr("content", seo().robots)}/> <meta name="theme-color" content="#d3a45c"/> <link rel="canonical"${attr("href", canonicalUrl())}/> <meta property="og:site_name" content="Lefine"/> <meta property="og:title"${attr("content", seo().title)}/> <meta property="og:description"${attr("content", seo().description)}/> <meta property="og:type"${attr("content", seo().type)}/> <meta property="og:url"${attr("content", canonicalUrl())}/> <meta property="og:image"${attr("content", imageUrl())}/> <meta property="og:image:alt" content="Lefine"/> <meta name="twitter:card" content="summary_large_image"/> <meta name="twitter:title"${attr("content", seo().title)}/> <meta name="twitter:description"${attr("content", seo().description)}/> <meta name="twitter:image"${attr("content", imageUrl())}/> `);
			$$renderer.push(`<script type="application/ld+json">{@html JSON.stringify(seo.jsonLd)}<\/script>`);
			$$renderer.push(` `);
			$$renderer.push(`<script>{@html \`window.__KEFINE_PUBLIC_CONFIG__ = \${JSON.stringify(publicConfig).replace(/</g, '\\\\u003c')};\`}<\/script>`);
		});
		children($$renderer);
		$$renderer.push(`<!---->`);
	});
}

export { _layout as default };
//# sourceMappingURL=_layout.svelte-BQIcFmCx.js.map
