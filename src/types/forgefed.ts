/**
 * ForgeFed type definitions
 * Based on the ForgeFed specification: https://forgefed.org
 * OKR-013.2 Task 1.2.2
 */

import type { ActivityPubActor, ActivityPubObject, ActivityPubCollection } from './activitypub';

/** ForgeFed @context constant */
export const FORGEFED_CONTEXT = 'https://forgefed.org/ns';
export const AP_CONTEXT = 'https://www.w3.org/ns/activitystreams';
export const OKR_CONTEXT = 'https://kefine.app/ns/okr';

/** Combined context for ForgeFed + OKR activities */
export const COMBINED_CONTEXT = [AP_CONTEXT, FORGEFED_CONTEXT, OKR_CONTEXT] as const;

/** OKR-specific status types */
export type OKRStatus = 'active' | 'completed' | 'archived';

/** OKR quarter */
export type OKRQuarter = 'Q1' | 'Q2' | 'Q3' | 'Q4';

/** OKR target type for key results */
export type OKRTargetType = 'number' | 'percentage' | 'boolean';

/** ForgeFed Ticket kinds */
export type TicketKind = 'Bug' | 'Feature' | 'Support' | 'Task' | 'Review';

/** ForgeFed Ticket statuses */
export type TicketStatus = 'open' | 'closed' | 'merged' | 'rejected';

/** ForgeFed Ticket priorities */
export type TicketPriority = 'low' | 'medium' | 'high' | 'critical';

/** ForgeFed Project roles */
export type ProjectRole = 'admin' | 'member' | 'viewer';

/**
 * ForgeFed Ticket — represents an issue or task (extends ActivityPub Object)
 * https://forgefed.org/spec/#issues
 */
export interface ForgeFedTicket extends ActivityPubObject {
  type: 'Ticket';
  /** Reference to the TicketTracker that tracks this ticket */
  ticketsTrackedBy?: string | ForgeFedTicketTracker;
  /** Whether this ticket has been resolved */
  isResolved?: boolean;
  /** Who the ticket is assigned to */
  assignedTo?: string | ActivityPubActor;
  /** Ticket reporter */
  attributedTo: string | ActivityPubActor;
  /** Ticket kind (Bug, Feature, etc.) */
  kind?: TicketKind;
  /** Ticket status */
  status?: TicketStatus;
  /** Ticket priority */
  priority?: TicketPriority;
  /** Labels/tags for the ticket */
  labels?: string[];
  /** Milestone this ticket belongs to */
  milestone?: string;
  /** Due date for this ticket */
  dueDate?: string;
  /** Comments on this ticket */
  replies?: ActivityPubCollection<ForgeFedTicketComment>;
  /** OKR-specific extensions */
  'okr:objectiveId'?: string;
  'okr:keyResultId'?: string;
  'okr:quarter'?: OKRQuarter;
  'okr:year'?: number;
  'okr:status'?: OKRStatus;
  'okr:targetType'?: OKRTargetType;
  'okr:targetValue'?: number;
  'okr:currentValue'?: number;
  'okr:weight'?: number;
}

/** ForgeFed Ticket comment (Note in reply to a Ticket) */
export interface ForgeFedTicketComment extends ActivityPubObject {
  type: 'Note';
  inReplyTo: string | ForgeFedTicket;
  attributedTo: string | ActivityPubActor;
  content: string;
}

/**
 * ForgeFed TicketTracker — tracks tickets for a project
 * https://forgefed.org/spec/#tickettracker
 */
export interface ForgeFedTicketTracker extends ActivityPubObject {
  type: 'TicketTracker';
  /** Reference to tickets tracked by this tracker */
  tracksTicketsFor?: string | ForgeFedProject;
  /** Collection of tickets */
  tickets?: ActivityPubCollection<ForgeFedTicket>;
}

/**
 * ForgeFed Project — represents a software project
 * https://forgefed.org/spec/#project
 */
export interface ForgeFedProject extends Omit<ActivityPubActor, 'type'> {
  type: 'Project';
  /** URL of the project's source repository */
  sourceRepository?: string;
  /** URL of the issue/ticket tracker */
  issueTracker?: string | ForgeFedTicketTracker;
  /** Patches/merge requests URL */
  sendPatchesTo?: string;
  /** Forks of this project */
  forks?: ActivityPubCollection<ForgeFedProject>;
  /** Whether this project is archived */
  isArchived?: boolean;
  /** Project members */
  members?: ActivityPubCollection<ActivityPubActor>;
  /** Project administrators */
  administrators?: ActivityPubCollection<ActivityPubActor>;
}

/**
 * ForgeFed Team — represents a group of actors
 * https://forgefed.org/spec/#team
 */
export interface ForgeFedTeam extends ActivityPubActor {
  type: 'Group';
  /** Team members */
  members?: ActivityPubCollection<ActivityPubActor>;
  /** Sub-teams */
  subteams?: ActivityPubCollection<ForgeFedTeam>;
  /** Parent team */
  parentTeam?: string | ForgeFedTeam;
}

/**
 * ForgeFed Grant — Object Capability (OCap) authorization
 * https://forgefed.org/spec/#grant
 */
export interface ForgeFedGrant extends ActivityPubObject {
  type: 'Grant';
  /** The capability context (resource being granted access to) */
  context?: string | ActivityPubObject;
  /** The target actor being granted access */
  target?: string | ActivityPubActor;
  /** Sub-grants this grant can delegate */
  delegates?: string | ForgeFedGrant;
  /** What actions are allowed */
  allows?: GrantPermission | GrantPermission[];
  /** The role being granted */
  role?: ProjectRole;
  /** When the grant becomes valid */
  startTime?: string;
  /** When the grant expires */
  endTime?: string;
  /** Result of the grant (what was given) */
  result?: string | ActivityPubObject;
}

/** Permissions that can be granted */
export type GrantPermission =
  | 'read'
  | 'write'
  | 'admin'
  | 'create-ticket'
  | 'edit-ticket'
  | 'close-ticket'
  | 'comment'
  | 'merge';

/**
 * ForgeFed Membership activity object
 */
export interface ForgeFedMembership extends ActivityPubObject {
  type: 'Membership';
  actor: string | ActivityPubActor;
  object: string | ForgeFedProject | ForgeFedTeam;
  role?: ProjectRole;
  startTime?: string;
  endTime?: string;
}
