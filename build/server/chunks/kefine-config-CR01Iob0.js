import { r as resolvePublicRuntimeConfig, n as normalizeText, D as DEFAULT_PUBLIC_RUNTIME_CONFIG } from './public-config-CCusQZMd.js';
import fs from 'node:fs';
import path from 'node:path';

//#region src/lib/server/kefine-config.ts
var DEFAULT_CONFIG = {
	app: DEFAULT_PUBLIC_RUNTIME_CONFIG.app,
	company: DEFAULT_PUBLIC_RUNTIME_CONFIG.company,
	origins: {
		primary: "https://lefine.pro",
		legal: "https://lefine.pro",
		task: "https://lefine.pro"
	},
	backend: {
		craterBaseUrl: "http://localhost:3001",
		exchangeBaseUrl: "http://localhost:3001",
		port: 3001,
		host: "0.0.0.0",
		environment: "development",
		databaseUrl: "postgresql://kefine:kefine@localhost:5432/kefine",
		logLevel: "info"
	},
	payment: {
		chainId: 43114,
		tokenAddress: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E",
		tokenSymbol: "USDC",
		tokenDecimals: 6
	}
};
function normalizeNumber(value, fallback) {
	return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}
function loadRawConfigFile() {
	const configPath = path.resolve(process.cwd(), "kefine.config.json");
	if (!fs.existsSync(configPath)) return {};
	try {
		return JSON.parse(fs.readFileSync(configPath, "utf8"));
	} catch {
		return {};
	}
}
var cachedConfig = null;
function getKefineConfig() {
	if (cachedConfig) return cachedConfig;
	const source = loadRawConfigFile();
	const objectSource = source && typeof source === "object" ? source : {};
	const publicConfig = resolvePublicRuntimeConfig({
		app: objectSource.app,
		company: objectSource.company
	});
	const origins = objectSource.origins ?? {};
	const backend = objectSource.backend ?? {};
	const payment = objectSource.payment ?? {};
	cachedConfig = {
		app: publicConfig.app,
		company: publicConfig.company,
		origins: {
			primary: normalizeText(origins.primary, DEFAULT_CONFIG.origins.primary),
			legal: normalizeText(origins.legal, DEFAULT_CONFIG.origins.legal),
			task: normalizeText(origins.task, DEFAULT_CONFIG.origins.task)
		},
		backend: {
			craterBaseUrl: normalizeText(backend.craterBaseUrl, DEFAULT_CONFIG.backend.craterBaseUrl),
			exchangeBaseUrl: normalizeText(backend.exchangeBaseUrl, DEFAULT_CONFIG.backend.exchangeBaseUrl),
			port: normalizeNumber(backend.port, DEFAULT_CONFIG.backend.port),
			host: normalizeText(backend.host, DEFAULT_CONFIG.backend.host),
			environment: normalizeText(backend.environment, DEFAULT_CONFIG.backend.environment),
			databaseUrl: normalizeText(backend.databaseUrl, DEFAULT_CONFIG.backend.databaseUrl),
			logLevel: normalizeText(backend.logLevel, DEFAULT_CONFIG.backend.logLevel)
		},
		payment: {
			evmAddress: normalizeText(payment.evmAddress),
			chainId: normalizeNumber(payment.chainId, DEFAULT_CONFIG.payment.chainId),
			tokenAddress: normalizeText(payment.tokenAddress, DEFAULT_CONFIG.payment.tokenAddress),
			tokenSymbol: normalizeText(payment.tokenSymbol, DEFAULT_CONFIG.payment.tokenSymbol),
			tokenDecimals: normalizeNumber(payment.tokenDecimals, DEFAULT_CONFIG.payment.tokenDecimals)
		}
	};
	return cachedConfig;
}
function getPublicRuntimeConfig() {
	const config = getKefineConfig();
	return {
		app: config.app,
		company: config.company
	};
}

export { getPublicRuntimeConfig as a, getKefineConfig as g };
//# sourceMappingURL=kefine-config-CR01Iob0.js.map
