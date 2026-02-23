// Environment variable loader utility
// Reads from process.env and provides typed access

export type Env = Record<string, string | undefined>;

/**
 * Get a required environment variable.
 * Returns the value or throws a descriptive error if not set.
 */
export function requireEnv(key: string, env: Env = process.env): string {
  const value = env[key];
  if (value === undefined || value === '') {
    throw new Error(`Required environment variable "${key}" is not set`);
  }
  return value;
}

/**
 * Get an optional environment variable with a default value.
 */
export function optionalEnv(key: string, defaultValue: string, env: Env = process.env): string {
  return env[key] ?? defaultValue;
}

/**
 * Get an optional numeric environment variable with a default value.
 */
export function optionalEnvInt(key: string, defaultValue: number, env: Env = process.env): number {
  const raw = env[key];
  if (raw === undefined || raw === '') return defaultValue;
  const parsed = parseInt(raw, 10);
  if (isNaN(parsed)) {
    throw new Error(`Environment variable "${key}" must be an integer, got: "${raw}"`);
  }
  return parsed;
}

/**
 * Get an optional boolean environment variable with a default value.
 * Truthy values: "true", "1", "yes"
 */
export function optionalEnvBool(key: string, defaultValue: boolean, env: Env = process.env): boolean {
  const raw = env[key];
  if (raw === undefined || raw === '') return defaultValue;
  return raw === 'true' || raw === '1' || raw === 'yes';
}
