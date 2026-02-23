/**
 * Actor discovery and endpoint discovery via WebFinger
 * OKR-013.7 Task 3.7.1 / Task 3.7.2
 *
 * Implements WebFinger (RFC 7033) and ActivityPub actor discovery.
 */

import type { ActivityPubActor } from '../../types/activitypub';
import { fetchActor } from './client';

const AP_ACCEPT = 'application/activity+json, application/ld+json; profile="https://www.w3.org/ns/activitystreams"';

/** WebFinger JRD (JSON Resource Descriptor) */
export interface WebFingerJRD {
  subject: string;
  aliases?: string[];
  properties?: Record<string, string>;
  links?: WebFingerLink[];
}

export interface WebFingerLink {
  rel: string;
  type?: string;
  href?: string;
  template?: string;
  titles?: Record<string, string>;
  properties?: Record<string, string>;
}

/** Discovered actor with cached endpoint info */
export interface DiscoveredActor {
  actor: ActivityPubActor;
  webfingerSubject?: string;
  discoveredAt: Date;
}

/** In-memory cache for discovered actors */
const actorCache = new Map<string, DiscoveredActor>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Resolve a WebFinger acct: URI or profile URL to its actor URL
 *
 * @param resource - Either an "acct:user@domain" string or a profile URL
 * @returns The ActivityPub actor URL
 */
export async function resolveActorUrl(resource: string): Promise<string> {
  // If it already looks like a URL, return as-is
  if (resource.startsWith('http://') || resource.startsWith('https://')) {
    return resource;
  }

  // Handle acct: scheme
  const acct = resource.startsWith('acct:') ? resource.slice(5) : resource;
  const atIdx = acct.lastIndexOf('@');
  if (atIdx === -1) throw new Error(`Invalid WebFinger resource: ${resource}`);

  const domain = acct.slice(atIdx + 1);
  const webfingerUrl = `https://${domain}/.well-known/webfinger?resource=${encodeURIComponent(`acct:${acct}`)}`;

  const res = await fetch(webfingerUrl, {
    headers: { Accept: 'application/jrd+json, application/json' }
  });

  if (!res.ok) {
    throw new Error(`WebFinger lookup failed for ${resource}: ${res.status} ${res.statusText}`);
  }

  const jrd: WebFingerJRD = await res.json();
  const apType = (AP_ACCEPT.split(',')[0] ?? '').trim();
  const selfLink = jrd.links?.find(
    (l) => l.rel === 'self' && l.type === apType
  );

  if (!selfLink?.href) {
    throw new Error(`No ActivityPub actor link found in WebFinger response for ${resource}`);
  }

  return selfLink.href;
}

/**
 * Discover an ActivityPub actor by URL or acct: resource
 *
 * @param resource - Actor URL or acct:user@domain
 * @param useCache - Whether to use the in-memory cache (default: true)
 */
export async function discoverActor(
  resource: string,
  useCache = true
): Promise<DiscoveredActor> {
  const actorUrl = await resolveActorUrl(resource);

  // Check cache
  if (useCache) {
    const cached = actorCache.get(actorUrl);
    if (cached && Date.now() - cached.discoveredAt.getTime() < CACHE_TTL_MS) {
      return cached;
    }
  }

  const actor = await fetchActor(actorUrl);

  // Validate actor type
  const validTypes = ['Application', 'Group', 'Organization', 'Person', 'Service', 'Project'];
  if (!validTypes.includes(actor.type)) {
    throw new Error(`Unexpected actor type: ${actor.type}`);
  }

  const discovered: DiscoveredActor = {
    actor,
    webfingerSubject: resource.startsWith('acct:') ? resource : undefined,
    discoveredAt: new Date()
  };

  actorCache.set(actorUrl, discovered);
  return discovered;
}

/**
 * Extract endpoint URLs from a discovered actor
 *
 * @param actor - The ActivityPub actor
 */
export function extractEndpoints(actor: ActivityPubActor): {
  inbox: string;
  outbox: string;
  followers?: string;
  following?: string;
  sharedInbox?: string;
} {
  return {
    inbox: actor.inbox,
    outbox: actor.outbox,
    followers: actor.followers,
    following: actor.following,
    sharedInbox: actor.endpoints?.sharedInbox
  };
}

/**
 * Invalidate the actor cache for a specific URL
 */
export function invalidateActorCache(actorUrl: string): void {
  actorCache.delete(actorUrl);
}

/**
 * Clear the entire actor cache
 */
export function clearActorCache(): void {
  actorCache.clear();
}
