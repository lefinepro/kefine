/**
 * ActivityPub client — handles POST to outbox and GET from inbox/outbox
 * OKR-013.8 / OKR-013.9
 *
 * Implements client-to-server (C2S) interactions as defined in:
 * https://www.w3.org/TR/activitypub/#client-to-server-interactions
 */

import type {
  ActivityPubActivity,
  ActivityPubActor,
  ActivityPubObject,
  ActivityPubCollection
} from '../../types/activitypub';
import { getAuthHeader } from '../auth/session';

/** Client configuration */
export interface ActivityPubClientConfig {
  /** The actor's ActivityPub ID (URL) */
  actorId: string;
  /** The actor's outbox URL */
  outboxUrl: string;
  /** The actor's inbox URL */
  inboxUrl: string;
}

/** ActivityPub content type header value */
const AP_CONTENT_TYPE = 'application/activity+json';
const AP_ACCEPT = 'application/activity+json, application/ld+json; profile="https://www.w3.org/ns/activitystreams"';

/**
 * Post an activity to the actor's outbox (C2S)
 * Returns the Location header URL of the created activity.
 *
 * @param outboxUrl - The actor's outbox endpoint
 * @param activity - The ActivityPub activity to post
 */
export async function postToOutbox(
  outboxUrl: string,
  activity: Omit<ActivityPubActivity, 'id'>
): Promise<string> {
  const authHeader = getAuthHeader();
  const headers: Record<string, string> = {
    'Content-Type': AP_CONTENT_TYPE,
    Accept: AP_ACCEPT
  };
  if (authHeader) headers['Authorization'] = authHeader;

  const res = await fetch(outboxUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify(activity)
  });

  if (!res.ok) {
    if (res.status === 401) throw new Error('Unauthorized: session expired or invalid.');
    if (res.status === 403) throw new Error('Forbidden: not allowed to post to this outbox.');
    if (res.status === 405) throw new Error('Method not allowed on this outbox.');
    throw new Error(`Failed to post activity: ${res.status} ${res.statusText}`);
  }

  const location = res.headers.get('Location');
  if (!location) throw new Error('Server did not return a Location header for the new activity.');
  return location;
}

/**
 * Fetch activities from an inbox or outbox collection
 *
 * @param collectionUrl - URL of the inbox or outbox
 * @param page - Optional page number for pagination
 */
export async function fetchCollection<T = ActivityPubActivity>(
  collectionUrl: string,
  page?: number
): Promise<ActivityPubCollection<T>> {
  const url = page !== undefined ? `${collectionUrl}?page=${page}` : collectionUrl;
  const authHeader = getAuthHeader();
  const headers: Record<string, string> = { Accept: AP_ACCEPT };
  if (authHeader) headers['Authorization'] = authHeader;

  const res = await fetch(url, { headers });

  if (!res.ok) {
    if (res.status === 403) throw new Error('Forbidden: cannot access this collection.');
    if (res.status === 404) throw new Error('Collection not found.');
    throw new Error(`Failed to fetch collection: ${res.status} ${res.statusText}`);
  }

  return res.json() as Promise<ActivityPubCollection<T>>;
}

/**
 * Fetch a single ActivityPub object by its URL ID
 *
 * @param objectUrl - The URL of the ActivityPub object
 */
export async function fetchObject<T extends ActivityPubObject>(objectUrl: string): Promise<T> {
  const authHeader = getAuthHeader();
  const headers: Record<string, string> = { Accept: AP_ACCEPT };
  if (authHeader) headers['Authorization'] = authHeader;

  const res = await fetch(objectUrl, { headers });

  if (res.status === 410) throw new Error('Object has been deleted (tombstone).');
  if (res.status === 403) throw new Error('Forbidden: cannot access this object.');
  if (res.status === 404) throw new Error('Object not found.');
  if (!res.ok) throw new Error(`Failed to fetch object: ${res.status} ${res.statusText}`);

  return res.json() as Promise<T>;
}

/**
 * Fetch an actor's profile by URL
 *
 * @param actorUrl - URL of the actor
 */
export async function fetchActor(actorUrl: string): Promise<ActivityPubActor> {
  return fetchObject<ActivityPubActor>(actorUrl);
}

/**
 * Create a "Create" activity wrapping an object
 *
 * @param actorId - The actor performing the create
 * @param object - The object being created
 * @param to - Recipients
 * @param cc - CC recipients
 */
export function buildCreateActivity(
  actorId: string,
  object: ActivityPubObject,
  to: string[] = ['https://www.w3.org/ns/activitystreams#Public'],
  cc: string[] = []
): Omit<ActivityPubActivity, 'id'> {
  return {
    '@context': [
      'https://www.w3.org/ns/activitystreams',
      'https://forgefed.org/ns'
    ],
    type: 'Create',
    actor: actorId,
    to,
    cc,
    object,
    published: new Date().toISOString()
  };
}

/**
 * Create an "Update" activity wrapping an updated object
 *
 * @param actorId - The actor performing the update
 * @param object - The updated object (must have an id)
 * @param to - Recipients
 */
export function buildUpdateActivity(
  actorId: string,
  object: ActivityPubObject & { id: string },
  to: string[] = ['https://www.w3.org/ns/activitystreams#Public']
): Omit<ActivityPubActivity, 'id'> {
  return {
    '@context': [
      'https://www.w3.org/ns/activitystreams',
      'https://forgefed.org/ns'
    ],
    type: 'Update',
    actor: actorId,
    to,
    object,
    published: new Date().toISOString()
  };
}

/**
 * Create a "Delete" activity for a given object ID
 *
 * @param actorId - The actor performing the deletion
 * @param objectId - The ID (URL) of the object being deleted
 * @param to - Recipients
 */
export function buildDeleteActivity(
  actorId: string,
  objectId: string,
  to: string[] = ['https://www.w3.org/ns/activitystreams#Public']
): Omit<ActivityPubActivity, 'id'> {
  return {
    '@context': 'https://www.w3.org/ns/activitystreams',
    type: 'Delete',
    actor: actorId,
    to,
    object: objectId,
    published: new Date().toISOString()
  };
}

/**
 * Create a "Follow" activity for an actor
 *
 * @param actorId - The actor who wants to follow
 * @param targetId - The actor being followed
 */
export function buildFollowActivity(
  actorId: string,
  targetId: string
): Omit<ActivityPubActivity, 'id'> {
  return {
    '@context': 'https://www.w3.org/ns/activitystreams',
    type: 'Follow',
    actor: actorId,
    object: targetId,
    published: new Date().toISOString()
  };
}

/**
 * Traverse all pages of a collection and return all items
 *
 * @param collectionUrl - URL of the root collection
 * @param maxItems - Maximum number of items to retrieve (prevents runaway fetches)
 */
export async function traverseCollection<T>(
  collectionUrl: string,
  maxItems = 200
): Promise<T[]> {
  const root = await fetchCollection<T>(collectionUrl);
  const items: T[] = [];

  // Collect items from root
  if (root.items) items.push(...root.items);
  if (root.orderedItems) items.push(...root.orderedItems);

  // Follow `first` page if not already resolved
  let nextUrl: string | null = null;
  if (typeof root.first === 'string') {
    nextUrl = root.first;
  } else if (root.first && typeof root.first === 'object') {
    const firstPage = root.first;
    if (firstPage.items) items.push(...firstPage.items);
    if (firstPage.orderedItems) items.push(...firstPage.orderedItems);
    nextUrl = typeof firstPage.next === 'string' ? firstPage.next : null;
  }

  // Traverse pages
  while (nextUrl && items.length < maxItems) {
    const page = await fetchCollection<T>(nextUrl);
    if (page.items) items.push(...page.items);
    if (page.orderedItems) items.push(...page.orderedItems);
    nextUrl = typeof page.next === 'string' ? page.next : null;
  }

  return items.slice(0, maxItems);
}
