export type Env = Record<string, string | undefined>;

export function requireEnv(key: string, env: Env = process.env): string {
  const value = env[key];
  if (value === undefined || value === '') {
    throw new Error(`Required environment variable "${key}" is not set`);
  }
  return value;
}

export function optionalEnv(key: string, defaultValue: string, env: Env = process.env): string {
  return env[key] ?? defaultValue;
}

export function optionalEnvInt(key: string, defaultValue: number, env: Env = process.env): number {
  const raw = env[key];
  if (raw === undefined || raw === '') return defaultValue;
  const parsed = parseInt(raw, 10);
  if (isNaN(parsed)) {
    throw new Error(`Environment variable "${key}" must be an integer, got: "${raw}"`);
  }
  return parsed;
}

export function optionalEnvBool(key: string, defaultValue: boolean, env: Env = process.env): boolean {
  const raw = env[key];
  if (raw === undefined || raw === '') return defaultValue;
  return raw === 'true' || raw === '1' || raw === 'yes';
}
