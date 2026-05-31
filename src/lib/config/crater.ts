import { optionalEnv, optionalEnvInt } from './env.js';

export interface CraterConfig {
  port: number;
  host: string;
  nodeEnv: string;
  simpleApiUrl: string;
  domain: string;
  actorUsername: string;
  logLevel: string;
}

export function loadCraterConfig(env: Record<string, string | undefined> = process.env): CraterConfig {
  return {
    port: optionalEnvInt('PORT', 3001, env),
    host: optionalEnv('HOST', '0.0.0.0', env),
    nodeEnv: optionalEnv('NODE_ENV', 'development', env),
    simpleApiUrl: optionalEnv('SIMPLE_API_URL', 'http://localhost:4000', env),
    domain: optionalEnv('DOMAIN', 'localhost:3001', env),
    actorUsername: optionalEnv('ACTOR_USERNAME', 'lepos', env),
    logLevel: optionalEnv('LOG_LEVEL', 'info', env)
  };
}
