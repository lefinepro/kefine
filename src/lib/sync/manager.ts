/**
 * Sync manager — orchestrates ActivityPub sync with federation
 * OKR-013.19 Task 6.19.1 / Task 6.19.3
 */

import { writable, get } from 'svelte/store';
import type { SyncState, SyncError, APNotification } from '../../types/models';
import type { ActivityPubActivity } from '../../types/activitypub';
import { getReadyActivities, dequeue, recordFailure } from './queue';
import { isAuthenticated, getAuthHeader } from '../auth/session';

const AP_CONTENT_TYPE = 'application/activity+json';

const initialSyncState: SyncState = {
  isSyncing: false,
  lastSyncedAt: undefined,
  pendingActivities: [],
  conflicts: [],
  errors: [],
  serverReachable: false
};

/** Reactive sync state store */
export const syncStore = writable<SyncState>(initialSyncState);

/** Notifications store */
export const notificationStore = writable<APNotification[]>([]);

/**
 * Update sync state fields
 */
function updateSync(partial: Partial<SyncState>): void {
  syncStore.update((s) => ({ ...s, ...partial }));
}

/**
 * Add a sync error to the store
 */
function addError(message: string, activityId?: string, objectId?: string): void {
  const error: SyncError = {
    id: crypto.randomUUID(),
    message,
    activityId,
    objectId,
    occurredAt: new Date(),
    resolved: false
  };
  syncStore.update((s) => ({ ...s, errors: [error, ...s.errors].slice(0, 50) }));
}

/**
 * Add a notification from an incoming AP activity
 */
export function addNotification(notification: Omit<APNotification, 'id' | 'read'>): void {
  const n: APNotification = { ...notification, id: crypto.randomUUID(), read: false };
  notificationStore.update((ns) => [n, ...ns].slice(0, 100));
}

/**
 * Mark a notification as read
 */
export function markNotificationRead(notificationId: string): void {
  notificationStore.update((ns) =>
    ns.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
  );
}

/**
 * Clear all notifications
 */
export function clearNotifications(): void {
  notificationStore.set([]);
}

/**
 * Check whether the ActivityPub server is reachable
 *
 * @param actorUrl - URL to probe for connectivity
 */
export async function checkServerReachability(actorUrl: string): Promise<boolean> {
  try {
    const res = await fetch(actorUrl, {
      method: 'HEAD',
      headers: { Accept: 'application/activity+json' },
      signal: AbortSignal.timeout(5000)
    });
    const reachable = res.ok;
    updateSync({ serverReachable: reachable });
    return reachable;
  } catch {
    updateSync({ serverReachable: false });
    return false;
  }
}

/**
 * Process the pending activity queue — attempt delivery for ready activities
 * OKR-013.19 Task 6.19.3
 */
export async function processPendingActivities(): Promise<void> {
  if (!isAuthenticated()) return;
  if (!navigator.onLine) return;

  const ready = getReadyActivities();
  if (ready.length === 0) return;

  const authHeader = getAuthHeader();
  if (!authHeader) return;

  for (const pending of ready) {
    for (const inboxUrl of pending.targetInboxes) {
      try {
        const res = await fetch(inboxUrl, {
          method: 'POST',
          headers: {
            'Content-Type': AP_CONTENT_TYPE,
            Authorization: authHeader
          },
          body: pending.activityJson
        });

        if (res.ok || res.status === 202) {
          dequeue(pending.id);
        } else {
          recordFailure(pending.id, `HTTP ${res.status}: ${res.statusText}`);
          addError(
            `Failed to deliver activity to ${inboxUrl}: ${res.status}`,
            pending.id
          );
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Network error';
        recordFailure(pending.id, message);
        addError(`Network error delivering to ${inboxUrl}: ${message}`, pending.id);
      }
    }
  }
}

/**
 * Process incoming activities from the actor's inbox
 *
 * @param inboxUrl - The actor's inbox URL
 */
export async function processInbox(inboxUrl: string): Promise<void> {
  if (!isAuthenticated()) return;

  const authHeader = getAuthHeader();
  if (!authHeader) return;

  try {
    const res = await fetch(inboxUrl, {
      headers: {
        Accept: 'application/activity+json',
        Authorization: authHeader
      }
    });

    if (!res.ok) {
      addError(`Failed to fetch inbox: ${res.status} ${res.statusText}`);
      return;
    }

    const collection = await res.json();
    const activities: ActivityPubActivity[] =
      collection.orderedItems ?? collection.items ?? [];

    for (const activity of activities) {
      processIncomingActivity(activity);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Network error';
    addError(`Failed to process inbox: ${message}`);
  }
}

/**
 * Process a single incoming ActivityPub activity
 *
 * @param activity - The incoming activity
 */
function processIncomingActivity(activity: ActivityPubActivity): void {
  const actorId = typeof activity.actor === 'string' ? activity.actor : activity.actor?.id ?? '';

  switch (activity.type) {
    case 'Create':
      addNotification({
        type: 'create',
        title: 'New object created',
        message: `${actorId} created a new object`,
        actorId,
        objectId: typeof activity.object === 'string' ? activity.object : undefined,
        createdAt: new Date()
      });
      break;

    case 'Update':
      addNotification({
        type: 'update',
        title: 'Object updated',
        message: `${actorId} updated an object`,
        actorId,
        objectId: typeof activity.object === 'string' ? activity.object : undefined,
        createdAt: new Date()
      });
      break;

    case 'Delete':
      addNotification({
        type: 'delete',
        title: 'Object deleted',
        message: `${actorId} deleted an object`,
        actorId,
        objectId: typeof activity.object === 'string' ? activity.object : undefined,
        createdAt: new Date()
      });
      break;

    case 'Follow':
      addNotification({
        type: 'follow',
        title: 'New follower',
        message: `${actorId} wants to follow you`,
        actorId,
        createdAt: new Date()
      });
      break;

    case 'Accept':
      addNotification({
        type: 'grant',
        title: 'Request accepted',
        message: `${actorId} accepted your request`,
        actorId,
        createdAt: new Date()
      });
      break;
  }
}

/**
 * Trigger a full sync cycle:
 * 1. Check server reachability
 * 2. Process pending outgoing activities
 * 3. Fetch and process incoming inbox activities
 *
 * @param actorUrl - The actor's profile URL (for reachability check)
 * @param inboxUrl - The actor's inbox URL
 */
export async function triggerSync(actorUrl: string, inboxUrl: string): Promise<void> {
  const state = get(syncStore);
  if (state.isSyncing) return; // prevent concurrent syncs

  updateSync({ isSyncing: true });

  try {
    // Step 1: Check connectivity
    const reachable = await checkServerReachability(actorUrl);
    if (!reachable) {
      updateSync({ isSyncing: false });
      return;
    }

    // Step 2: Deliver pending outgoing activities
    await processPendingActivities();

    // Step 3: Fetch incoming activities
    await processInbox(inboxUrl);

    updateSync({ lastSyncedAt: new Date(), isSyncing: false });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Sync error';
    addError(`Sync failed: ${message}`);
    updateSync({ isSyncing: false });
  }
}
