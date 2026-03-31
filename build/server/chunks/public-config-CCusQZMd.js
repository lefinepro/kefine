//#region src/lib/config/public-config.ts
var DEFAULT_PUBLIC_RUNTIME_CONFIG = {
	app: {
		name: "Lefine",
		supportEmail: "order@lefine.pro",
		githubUrl: "https://github.com/lefine",
		reownProjectId: "909acf523be03f300ad21cca95d966c8",
		socialLinks: {
			mastodon: "https://mastodon.social/@lefine",
			discord: "https://discord.com/invite/lefine",
			linkedin: "https://www.linkedin.com/company/lefine",
			telegram: "https://t.me/lefine"
		},
		legalUpdatedAt: {
			en: "March 2026",
			ru: "Март 2026",
			hy: "Մարտ 2026"
		}
	},
	company: {
		legalName: "Lefine",
		businessType: "",
		registrationDate: "",
		country: "Armenia",
		registeredAddress: "",
		email: "order@lefine.pro",
		phone: "",
		registrationNumber: "",
		vatNumber: "",
		taxId: "",
		soleProprietor: "",
		legalDisclaimer: ""
	}
};
function normalizeText(value, fallback = "") {
	return typeof value === "string" ? value.trim() || fallback : fallback;
}
function resolvePublicRuntimeConfig(value) {
	if (!value || typeof value !== "object") return DEFAULT_PUBLIC_RUNTIME_CONFIG;
	const source = value;
	const app = source.app ?? {};
	const company = source.company ?? {};
	const socialLinks = app.socialLinks ?? {};
	const legalUpdatedAt = app.legalUpdatedAt ?? {};
	return {
		app: {
			name: normalizeText(app.name, DEFAULT_PUBLIC_RUNTIME_CONFIG.app.name),
			supportEmail: normalizeText(app.supportEmail, DEFAULT_PUBLIC_RUNTIME_CONFIG.app.supportEmail),
			githubUrl: normalizeText(app.githubUrl, DEFAULT_PUBLIC_RUNTIME_CONFIG.app.githubUrl),
			reownProjectId: normalizeText(app.reownProjectId, DEFAULT_PUBLIC_RUNTIME_CONFIG.app.reownProjectId),
			socialLinks: {
				mastodon: normalizeText(socialLinks.mastodon, DEFAULT_PUBLIC_RUNTIME_CONFIG.app.socialLinks.mastodon),
				discord: normalizeText(socialLinks.discord, DEFAULT_PUBLIC_RUNTIME_CONFIG.app.socialLinks.discord),
				linkedin: normalizeText(socialLinks.linkedin, DEFAULT_PUBLIC_RUNTIME_CONFIG.app.socialLinks.linkedin),
				telegram: normalizeText(socialLinks.telegram, DEFAULT_PUBLIC_RUNTIME_CONFIG.app.socialLinks.telegram)
			},
			legalUpdatedAt: {
				en: normalizeText(legalUpdatedAt.en, DEFAULT_PUBLIC_RUNTIME_CONFIG.app.legalUpdatedAt.en),
				ru: normalizeText(legalUpdatedAt.ru, DEFAULT_PUBLIC_RUNTIME_CONFIG.app.legalUpdatedAt.ru),
				hy: normalizeText(legalUpdatedAt.hy, DEFAULT_PUBLIC_RUNTIME_CONFIG.app.legalUpdatedAt.hy)
			}
		},
		company: {
			legalName: normalizeText(company.legalName, DEFAULT_PUBLIC_RUNTIME_CONFIG.company.legalName),
			businessType: normalizeText(company.businessType),
			registrationDate: normalizeText(company.registrationDate),
			country: normalizeText(company.country, DEFAULT_PUBLIC_RUNTIME_CONFIG.company.country),
			registeredAddress: normalizeText(company.registeredAddress),
			email: normalizeText(company.email, DEFAULT_PUBLIC_RUNTIME_CONFIG.company.email),
			phone: normalizeText(company.phone),
			registrationNumber: normalizeText(company.registrationNumber),
			vatNumber: normalizeText(company.vatNumber),
			taxId: normalizeText(company.taxId),
			soleProprietor: normalizeText(company.soleProprietor),
			legalDisclaimer: normalizeText(company.legalDisclaimer)
		}
	};
}
function readBrowserPublicRuntimeConfig() {
	if (typeof window === "undefined") return DEFAULT_PUBLIC_RUNTIME_CONFIG;
	return resolvePublicRuntimeConfig(window.__KEFINE_PUBLIC_CONFIG__);
}

export { DEFAULT_PUBLIC_RUNTIME_CONFIG as D, readBrowserPublicRuntimeConfig as a, normalizeText as n, resolvePublicRuntimeConfig as r };
//# sourceMappingURL=public-config-CCusQZMd.js.map
