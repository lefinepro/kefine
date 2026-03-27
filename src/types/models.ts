import type { Objective, KeyResult, Task, OKRLink } from '$lib/types/okr';
type OKRQuarter = 'Q1' | 'Q2' | 'Q3' | 'Q4';
type OKRStatus = 'active' | 'completed' | 'archived';
type TicketStatus = 'open' | 'closed' | 'merged' | 'rejected';
type TicketPriority = 'low' | 'medium' | 'high' | 'critical';

/** Extended Objective with remote-tracking fields */
export interface ObjectiveModel extends Objective {
  /** Remote ticket ID (URL) */
  apId?: string;
  /** Remote ticket tracker URL */
  ticketTrackerUrl?: string;
  /** Remote project ID */
  projectId?: string;
  /** Remote ticket status */
  ffStatus?: TicketStatus;
  /** Last time this was synced remotely */
  lastFederatedAt?: Date;
  /** Whether there are pending remote sync activities */
  hasPendingSync?: boolean;
}

/** Extended KeyResult with remote-tracking fields */
export interface KeyResultModel extends KeyResult {
  /** Remote sub-ticket ID (URL) */
  apId?: string;
  /** Parent remote ticket ID */
  parentTicketId?: string;
  /** Remote ticket priority */
  ffPriority?: TicketPriority;
  /** Last time this was synced remotely */
  lastFederatedAt?: Date;
  /** Whether there are pending remote sync activities */
  hasPendingSync?: boolean;
}

/** Extended Task with remote-tracking fields */
export interface TaskModel extends Task {
  /** Remote ticket ID (URL) */
  apId?: string;
  /** Remote ticket status */
  ffStatus?: TicketStatus;
  /** Remote ticket priority */
  ffPriority?: TicketPriority;
  /** Last time this was synced remotely */
  lastFederatedAt?: Date;
  /** Whether there are pending remote sync activities */
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

/** Pending remote activity waiting to be delivered */
export interface PendingActivity {
  /** Local ID for the pending activity */
  id: string;
  /** Serialized remote activity JSON */
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
  /** Remote version */
  remote: ObjectiveModel | KeyResultModel | TaskModel;
  /** Fields that conflict */
  conflictingFields: string[];
  /** When the conflict was detected */
  detectedAt: Date;
}

/** Sync state for remote delivery */
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

/** Notification from remote activity processing */
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
