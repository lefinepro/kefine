/**
 * Activity queue — manages pending ActivityPub activities for delivery
 * OKR-013.19 Task 6.19.2
 *
 * Provides a persistent, retry-capable queue for outgoing AP activities.
 */

import type { PendingActivity } from '../../types/models';
import type { ActivityPubActivity } from '../../types/activitypub';

const QUEUE_STORAGE_KEY = 'ap-activity-queue';

/** Maximum number of delivery attempts before giving up */
const MAX_ATTEMPTS = 5;

/** Base retry delay in milliseconds (doubles each attempt) */
const BASE_RETRY_DELAY_MS = 30_000; // 30 seconds

/**
 * Load the pending activity queue from localStorage
 */
export function loadQueue(): PendingActivity[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(QUEUE_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw, (_key, value) => {
      if (value && typeof value === 'object' && value.__type === 'Date') {
        return new Date(value.value);
      }
      return value;
    }) as PendingActivity[];
  } catch {
    return [];
  }
}

function saveQueue(queue: PendingActivity[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(
    QUEUE_STORAGE_KEY,
    JSON.stringify(queue, (_key, value) => {
      if (value instanceof Date) return { __type: 'Date', value: value.toISOString() };
      return value;
    })
  );
}

/**
 * Enqueue an activity for delivery
 *
 * @param activity - The AP activity to deliver
 * @param targetInboxes - One or more inbox URLs to deliver to
 * @returns The queued PendingActivity
 */
export function enqueue(
  activity: Omit<ActivityPubActivity, 'id'>,
  targetInboxes: string[]
): PendingActivity {
  const pending: PendingActivity = {
    id: crypto.randomUUID(),
    activityJson: JSON.stringify(activity),
    targetInboxes,
    attempts: 0,
    createdAt: new Date()
  };

  const queue = loadQueue();
  queue.push(pending);
  saveQueue(queue);
  return pending;
}

/**
 * Mark an activity as successfully delivered and remove from queue
 *
 * @param activityId - ID of the pending activity to remove
 */
export function dequeue(activityId: string): void {
  const queue = loadQueue().filter((a) => a.id !== activityId);
  saveQueue(queue);
}

/**
 * Record a failed delivery attempt and schedule retry
 *
 * @param activityId - ID of the pending activity
 * @param error - Error message from the failed attempt
 */
export function recordFailure(activityId: string, error: string): void {
  const queue = loadQueue();
  const idx = queue.findIndex((a) => a.id === activityId);
  if (idx === -1) return;

  const activity = queue[idx];
  if (!activity) return;

  activity.attempts += 1;
  activity.lastError = error;

  if (activity.attempts >= MAX_ATTEMPTS) {
    // Give up — remove from queue after max attempts
    queue.splice(idx, 1);
  } else {
    // Exponential backoff: 30s, 60s, 120s, 240s, ...
    const delayMs = BASE_RETRY_DELAY_MS * Math.pow(2, activity.attempts - 1);
    activity.nextRetryAt = new Date(Date.now() + delayMs);
  }

  saveQueue(queue);
}

/**
 * Get activities that are ready to be retried (past their nextRetryAt)
 */
export function getReadyActivities(): PendingActivity[] {
  const now = new Date();
  return loadQueue().filter(
    (a) => !a.nextRetryAt || a.nextRetryAt <= now
  );
}

/**
 * Clear the entire activity queue (use with caution)
 */
export function clearQueue(): void {
  saveQueue([]);
}

/**
 * Get the count of pending activities
 */
export function getQueueSize(): number {
  return loadQueue().length;
}
