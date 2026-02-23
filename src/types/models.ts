/**
 * Internal model types — bridge between OKR data model and AP/ForgeFed
 * OKR-013.2 Task 1.2.4
 */

import type { Objective, KeyResult, Task, OKRLink } from '$lib/types/okr';
import type { OKRQuarter, OKRStatus, TicketStatus, TicketPriority } from './forgefed';

/** Extended Objective with ActivityPub/ForgeFed federation fields */
export interface ObjectiveModel extends Objective {
  /** ActivityPub/ForgeFed ID (URL) of the federated ticket */
  apId?: string;
  /** URL of the ForgeFed ticket tracker */
  ticketTrackerUrl?: string;
  /** ActivityPub ID of the federated project */
  projectId?: string;
  /** ForgeFed ticket status (maps to ObjectiveStatus) */
  ffStatus?: TicketStatus;
  /** Last time this was synced to federation */
  lastFederatedAt?: Date;
  /** Whether there are pending outgoing federation activities */
  hasPendingSync?: boolean;
}

/** Extended KeyResult with ActivityPub/ForgeFed federation fields */
export interface KeyResultModel extends KeyResult {
  /** ActivityPub/ForgeFed ID (URL) of the federated sub-ticket */
  apId?: string;
  /** ActivityPub ID of the parent objective ticket */
  parentTicketId?: string;
  /** ForgeFed ticket priority */
  ffPriority?: TicketPriority;
  /** Last time this was synced to federation */
  lastFederatedAt?: Date;
  /** Whether there are pending outgoing federation activities */
  hasPendingSync?: boolean;
}

/** Extended Task with ActivityPub/ForgeFed federation fields */
export interface TaskModel extends Task {
  /** ActivityPub/ForgeFed ID (URL) of the federated ticket */
  apId?: string;
  /** ForgeFed ticket status */
  ffStatus?: TicketStatus;
  /** ForgeFed ticket priority */
  ffPriority?: TicketPriority;
  /** Last time this was synced to federation */
  lastFederatedAt?: Date;
  /** Whether there are pending outgoing federation activities */
  hasPendingSync?: boolean;
}

/** Complete OKR model with all objects */
export interface OKRModel {
  objectives: ObjectiveModel[];
  keyResults: KeyResultModel[];
  tasks: TaskModel[];
  okrLinks: OKRLink[];
  metadata: {
    quarter?: OKRQuarter;
    year?: number;
    title?: string;
    description?: string;
    status?: OKRStatus;
    lastModified: Date;
  };
}

/** Pending ActivityPub activity waiting to be delivered */
export interface PendingActivity {
  /** Local ID for the pending activity */
  id: string;
  /** Serialized ActivityPub activity JSON */
  activityJson: string;
  /** Target inbox URL(s) */
  targetInboxes: string[];
  /** Number of delivery attempts so far */
  attempts: number;
  /** When this activity was first queued */
  createdAt: Date;
  /** When the next retry attempt should happen */
  nextRetryAt?: Date;
  /** Last error message (if any) */
  lastError?: string;
}

/** Conflict between local and remote versions of an object */
export interface Conflict {
  /** ID of the conflicting object */
  objectId: string;
  /** Type of conflict */
  type: 'objective' | 'keyResult' | 'task';
  /** Local version */
  local: ObjectiveModel | KeyResultModel | TaskModel;
  /** Remote version (from federation) */
  remote: ObjectiveModel | KeyResultModel | TaskModel;
  /** Fields that conflict */
  conflictingFields: string[];
  /** When the conflict was detected */
  detectedAt: Date;
}

/** Sync state for ActivityPub federation */
export interface SyncState {
  /** Whether currently syncing */
  isSyncing: boolean;
  /** Last successful sync timestamp */
  lastSyncedAt?: Date;
  /** Pending activities queue */
  pendingActivities: PendingActivity[];
  /** Detected conflicts awaiting resolution */
  conflicts: Conflict[];
  /** Sync errors */
  errors: SyncError[];
  /** Whether the AP server is reachable */
  serverReachable: boolean;
}

/** Sync error */
export interface SyncError {
  id: string;
  message: string;
  activityId?: string;
  objectId?: string;
  occurredAt: Date;
  resolved: boolean;
}

/** Notification from inbox activity processing */
export interface APNotification {
  id: string;
  type: 'create' | 'update' | 'delete' | 'follow' | 'mention' | 'grant';
  title: string;
  message: string;
  actorId?: string;
  actorName?: string;
  objectId?: string;
  createdAt: Date;
  read: boolean;
}
