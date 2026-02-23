/**
 * Configuration management for ActivityPub/ForgeFed integration
 * OKR-013.3 Task 1.3.3
 */

const CONFIG_STORAGE_KEY = 'ap-federation-config';

/** Federation configuration */
export interface FederationConfig {
  /** The actor's ActivityPub profile URL */
  actorId: string;
  /** The actor's inbox URL */
  inboxUrl: string;
  /** The actor's outbox URL */
  outboxUrl: string;
  /** The ForgeFed project URL to track tickets in */
  forgeFedProjectUrl: string;
  /** The ticket tracker URL */
  ticketTrackerUrl: string;
  /** Server authentication endpoint base URL */
  authEndpoint: string;
  /** Whether federation is enabled */
  enabled: boolean;
  /** WebFinger domain for discovery */
  domain?: string;
}

/** Default (empty) configuration */
const defaultConfig: FederationConfig = {
  actorId: '',
  inboxUrl: '',
  outboxUrl: '',
  forgeFedProjectUrl: '',
  ticketTrackerUrl: '',
  authEndpoint: '',
  enabled: false
};

/**
 * Load federation configuration from localStorage
 */
export function loadConfig(): FederationConfig {
  if (typeof window === 'undefined') return { ...defaultConfig };
  try {
    const raw = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (!raw) return { ...defaultConfig };
    return { ...defaultConfig, ...JSON.parse(raw) } as FederationConfig;
  } catch {
    return { ...defaultConfig };
  }
}

/**
 * Save federation configuration to localStorage
 */
export function saveConfig(config: Partial<FederationConfig>): FederationConfig {
  const existing = loadConfig();
  const updated = { ...existing, ...config };
  if (typeof window !== 'undefined') {
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(updated));
  }
  return updated;
}

/**
 * Validate a federation configuration
 */
export function validateConfig(config: FederationConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!config.actorId) errors.push('Actor ID (profile URL) is required');
  if (!config.inboxUrl) errors.push('Inbox URL is required');
  if (!config.outboxUrl) errors.push('Outbox URL is required');
  if (!config.authEndpoint) errors.push('Auth endpoint is required');

  // Validate URL formats
  const urlFields: (keyof FederationConfig)[] = ['actorId', 'inboxUrl', 'outboxUrl', 'authEndpoint'];
  for (const field of urlFields) {
    const val = config[field] as string;
    if (val) {
      try {
        new URL(val);
      } catch {
        errors.push(`${field} must be a valid URL`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Reset configuration to defaults
 */
export function resetConfig(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(CONFIG_STORAGE_KEY);
  }
}

/**
 * Try to auto-discover actor endpoints from an actor URL
 * Updates the config with discovered values.
 *
 * @param actorUrl - The actor profile URL
 */
export async function autoDiscoverConfig(actorUrl: string): Promise<Partial<FederationConfig>> {
  const res = await fetch(actorUrl, {
    headers: { Accept: 'application/activity+json' }
  });

  if (!res.ok) throw new Error(`Failed to fetch actor: ${res.status}`);

  const actor = await res.json();
  const partial: Partial<FederationConfig> = {
    actorId: actor.id ?? actorUrl,
    inboxUrl: actor.inbox ?? '',
    outboxUrl: actor.outbox ?? ''
  };

  // Try to extract auth endpoints
  if (actor.endpoints?.oauthAuthorizationEndpoint) {
    // Derive auth base from OAuth endpoint
    try {
      const oauthUrl = new URL(actor.endpoints.oauthAuthorizationEndpoint);
      partial.authEndpoint = `${oauthUrl.protocol}//${oauthUrl.host}`;
    } catch {
      // ignore
    }
  }

  return partial;
}
