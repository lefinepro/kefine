import fs from 'node:fs';
import path from 'node:path';
import {
  DEFAULT_PUBLIC_RUNTIME_CONFIG,
  KEFINE_FEATURE_FLAG_IDS,
  normalizeFeatureFlags,
  normalizeText,
  resolvePublicRuntimeConfig,
  type KefineDefaultActorPublicConfig,
  type KefineFeatureFlags,
  type KefinePinnedServiceConfig,
  type KefinePublicRuntimeConfig
} from '$lib/config/public-config';

type KefineFullConfig = {
  app: KefinePublicRuntimeConfig['app'];
  services: KefinePinnedServiceConfig[];
  defaultActor: KefineDefaultActorPublicConfig & {
    privateKey: string;
  };
  features: KefineFeatureFlags;
  backend: {
    craterBaseUrl: string;
    exchangeBaseUrl: string;
    port: number;
    host: string;
    environment: string;
    databaseUrl: string;
    logLevel: string;
  };
  payment: {
    evmAddress: string;
    chainId: number;
    tokenAddress: string;
    tokenSymbol: string;
    tokenDecimals: number;
  };
};

const DEFAULT_CONFIG: KefineFullConfig = {
  app: DEFAULT_PUBLIC_RUNTIME_CONFIG.app,
  services: DEFAULT_PUBLIC_RUNTIME_CONFIG.services,
  defaultActor: {
    ...DEFAULT_PUBLIC_RUNTIME_CONFIG.defaultActor,
    privateKey: ''
  },
  features: DEFAULT_PUBLIC_RUNTIME_CONFIG.features,
  backend: {
    craterBaseUrl: 'http://localhost:3001',
    exchangeBaseUrl: 'http://localhost:3001',
    port: 3001,
    host: '0.0.0.0',
    environment: 'development',
    databaseUrl: 'postgresql://kefine:kefine@localhost:5432/kefine',
    logLevel: 'info'
  },
  payment: {
    evmAddress: '',
    chainId: 43114,
    tokenAddress: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E',
    tokenSymbol: 'USDC',
    tokenDecimals: 6
  }
};

function normalizeNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function loadRawConfigFile(): unknown {
  const configPath = path.resolve(process.cwd(), 'kefine.config.json');
  if (!fs.existsSync(configPath)) {
    return {};
  }

  try {
    return JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch {
    return {};
  }
}

let cachedConfig: KefineFullConfig | null = null;

function readEnvironmentOverride(name: string): string {
  return normalizeText(process.env[name]);
}

/**
 * Applies per-feature environment overrides on top of the configured flags.
 * Each flag can be toggled with `KEFINE_FEATURE_<ID>` (e.g.
 * `KEFINE_FEATURE_REPOSITORIES=true`). Unset or empty variables leave the
 * configured value untouched.
 */
function applyFeatureFlagEnvOverrides(base: KefineFeatureFlags): KefineFeatureFlags {
  const resolved = { ...base };
  for (const id of KEFINE_FEATURE_FLAG_IDS) {
    const override = readEnvironmentOverride(`KEFINE_FEATURE_${id.toUpperCase()}`);
    if (override !== '') {
      resolved[id] = normalizeFeatureFlags({ [id]: override })[id];
    }
  }
  return resolved;
}

export function getKefineConfig(): KefineFullConfig {
  if (cachedConfig) {
    return cachedConfig;
  }

  const source = loadRawConfigFile();
  const objectSource = source && typeof source === 'object' ? (source as Record<string, unknown>) : {};
  const publicConfig = resolvePublicRuntimeConfig({
    app: objectSource.app,
    services: objectSource.services,
    defaultActor: objectSource.defaultActor,
    features: objectSource.features
  });
  const defaultActor = (objectSource.defaultActor ?? {}) as Record<string, unknown>;
  const backend = (objectSource.backend ?? {}) as Record<string, unknown>;
  const payment = (objectSource.payment ?? {}) as Record<string, unknown>;

  cachedConfig = {
    app: publicConfig.app,
    services: publicConfig.services,
    features: applyFeatureFlagEnvOverrides(publicConfig.features),
    defaultActor: {
      handle: publicConfig.defaultActor.handle,
      displayName: publicConfig.defaultActor.displayName,
      privateKey: normalizeText(
        readEnvironmentOverride('KEFINE_PRIVATEKEY_DEFAULT'),
        normalizeText(
          typeof defaultActor.privateKey === 'string' ? defaultActor.privateKey : '',
          normalizeText(
            typeof defaultActor.privateKeyPem === 'string' ? defaultActor.privateKeyPem : '',
            DEFAULT_CONFIG.defaultActor.privateKey
          )
        )
      )
    },
    backend: {
      craterBaseUrl: normalizeText(
        readEnvironmentOverride('CRATER_BASE_URL'),
        normalizeText(backend.craterBaseUrl, DEFAULT_CONFIG.backend.craterBaseUrl)
      ),
      exchangeBaseUrl: normalizeText(
        readEnvironmentOverride('EXCHANGE_BASE_URL'),
        normalizeText(backend.exchangeBaseUrl, DEFAULT_CONFIG.backend.exchangeBaseUrl)
      ),
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

export function getPublicRuntimeConfig(): KefinePublicRuntimeConfig {
  const config = getKefineConfig();
  return {
    app: config.app,
    services: config.services,
    defaultActor: {
      handle: config.defaultActor.handle,
      displayName: config.defaultActor.displayName
    },
    features: config.features,
    backend: {
      craterBaseUrl: config.backend.craterBaseUrl
    }
  };
}
