/**
 * ForgeFed Grant (Object Capability) management
 * OKR-013.6 Task 2.6.1 / Task 2.6.2 / Task 2.6.3
 *
 * Implements the ForgeFed Grant (OCap) authorization model:
 * https://forgefed.org/spec/#grant
 */

import type { ForgeFedGrant, GrantPermission } from '../../types/forgefed';
import type { ActivityPubActivity } from '../../types/activitypub';
import { postToOutbox, fetchObject } from '../activitypub/client';

const GRANT_STORAGE_KEY = 'forgefed-grants';

/** A stored grant with its scope metadata */
export interface StoredGrant {
  /** The Grant AP ID (URL) */
  id: string;
  /** The resource this grant applies to (project URL, tracker URL, etc.) */
  resourceId: string;
  /** Permissions this grant allows */
  permissions: GrantPermission[];
  /** When this grant expires (null = no expiry) */
  expiresAt: Date | null;
  /** The raw ForgeFed Grant object */
  raw: ForgeFedGrant;
  /** When we received/stored this grant */
  receivedAt: Date;
}

/** Load stored grants from localStorage */
export function loadStoredGrants(): StoredGrant[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(GRANT_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw, (_key, value) => {
      if (value && typeof value === 'object' && value.__type === 'Date') {
        return new Date(value.value);
      }
      return value;
    }) as StoredGrant[];
  } catch {
    return [];
  }
}

function saveGrants(grants: StoredGrant[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(
    GRANT_STORAGE_KEY,
    JSON.stringify(grants, (_key, value) => {
      if (value instanceof Date) return { __type: 'Date', value: value.toISOString() };
      return value;
    })
  );
}

/**
 * Store a received Grant
 */
export function storeGrant(grant: ForgeFedGrant, permissions: GrantPermission[]): StoredGrant {
  const stored: StoredGrant = {
    id: grant.id ?? crypto.randomUUID(),
    resourceId: typeof grant.context === 'string' ? grant.context : grant.context?.id ?? '',
    permissions,
    expiresAt: grant.endTime ? new Date(grant.endTime) : null,
    raw: grant,
    receivedAt: new Date()
  };

  const existing = loadStoredGrants();
  const updated = [...existing.filter((g) => g.id !== stored.id), stored];
  saveGrants(updated);
  return stored;
}

/**
 * Remove a stored Grant (after revocation)
 */
export function removeGrant(grantId: string): void {
  const existing = loadStoredGrants();
  saveGrants(existing.filter((g) => g.id !== grantId));
}

/**
 * Find an active grant for a given resource and required permission
 *
 * @param resourceId - The resource URL to find a grant for
 * @param requiredPermission - The permission that must be allowed
 */
export function findActiveGrant(
  resourceId: string,
  requiredPermission: GrantPermission
): StoredGrant | null {
  const grants = loadStoredGrants();
  const now = new Date();

  return (
    grants.find((g) => {
      if (g.resourceId !== resourceId) return false;
      if (g.expiresAt && g.expiresAt <= now) return false;
      return g.permissions.includes(requiredPermission);
    }) ?? null
  );
}

/**
 * Validate a ForgeFed Grant object
 * OKR-013.6 Task 2.6.1
 */
export function validateGrant(grant: ForgeFedGrant): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!grant.id) errors.push('Grant must have an id');
  if (!grant.context) errors.push('Grant must have a context (resource)');
  if (!grant.target) errors.push('Grant must have a target (actor being granted access)');

  // Check time bounds
  if (grant.startTime && grant.endTime) {
    const start = new Date(grant.startTime);
    const end = new Date(grant.endTime);
    if (end <= start) errors.push('Grant endTime must be after startTime');
    if (end <= new Date()) errors.push('Grant has already expired');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Request a Grant from a resource owner by sending an Offer activity
 * OKR-013.6 Task 2.6.2
 *
 * @param actorId - Your actor ID
 * @param outboxUrl - Your outbox URL
 * @param resourceId - The resource you want access to
 * @param permissions - Permissions you're requesting
 * @returns Location of the Offer activity
 */
export async function requestGrant(
  actorId: string,
  outboxUrl: string,
  resourceId: string,
  permissions: GrantPermission[]
): Promise<string> {
  const offerActivity: Omit<ActivityPubActivity, 'id'> = {
    '@context': ['https://www.w3.org/ns/activitystreams', 'https://forgefed.org/ns'],
    type: 'Offer',
    actor: actorId,
    to: [resourceId],
    object: {
      type: 'Grant',
      target: actorId,
      context: resourceId,
      allows: permissions
    } as ForgeFedGrant,
    published: new Date().toISOString()
  };

  return postToOutbox(outboxUrl, offerActivity);
}

/**
 * Fetch and validate a Grant by its URL
 *
 * @param grantUrl - URL of the Grant object
 */
export async function fetchAndValidateGrant(grantUrl: string): Promise<{
  grant: ForgeFedGrant;
  valid: boolean;
  errors: string[];
}> {
  const grant = await fetchObject<ForgeFedGrant>(grantUrl);
  const { valid, errors } = validateGrant(grant);
  return { grant, valid, errors };
}

/**
 * Get headers for including a Grant in ActivityPub requests
 * OKR-013.6 Task 2.6.3
 *
 * @param grant - The stored grant to use
 */
export function getGrantHeaders(grant: StoredGrant): Record<string, string> {
  return {
    'Authorization-Grant': grant.id
  };
}
