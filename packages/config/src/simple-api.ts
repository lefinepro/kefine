// Configuration schema and defaults for the Simple API service
import { optionalEnv, optionalEnvInt, optionalEnvBool } from './env.js';

export interface SimpleApiConfig {
  port: number;
  host: string;
  nodeEnv: string;
  allowedOrigins: string[];
  logLevel: string;
  requestTimeout: number;
  enableHelmet: boolean;
}

/**
 * Load Simple API configuration from environment variables.
 * All values have sensible defaults for local development.
 */
export function loadSimpleApiConfig(env: Record<string, string | undefined> = process.env): SimpleApiConfig {
  const originsRaw = optionalEnv('ALLOWED_ORIGINS', 'http://localhost:5173', env);
  const allowedOrigins = originsRaw.split(',').map((o) => o.trim()).filter(Boolean);

  return {
    port: optionalEnvInt('PORT', 4000, env),
    host: optionalEnv('HOST', '0.0.0.0', env),
    nodeEnv: optionalEnv('NODE_ENV', 'development', env),
    allowedOrigins,
    logLevel: optionalEnv('LOG_LEVEL', 'info', env),
    requestTimeout: optionalEnvInt('REQUEST_TIMEOUT_MS', 30000, env),
    enableHelmet: optionalEnvBool('ENABLE_HELMET', true, env),
  };
}
