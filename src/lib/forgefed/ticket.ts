/**
 * ForgeFed Ticket serialization and deserialization
 * OKR-013.11 Task 4.11.1 / Task 4.11.2
 *
 * Converts between OKR model objects and ForgeFed Ticket AP objects.
 */

import type { ForgeFedTicket, ForgeFedTicketComment, TicketKind, TicketStatus, TicketPriority } from '../../types/forgefed';
import type { ObjectiveModel, KeyResultModel, TaskModel } from '../../types/models';
import type { Objective, Task } from '$lib/types/okr';
import { COMBINED_CONTEXT } from '../../types/forgefed';
import {
  buildCreateActivity,
  buildUpdateActivity,
  postToOutbox
} from '../activitypub/client';
import type { ActivityPubActivity } from '../../types/activitypub';

/** Map OKR status to ForgeFed ticket status */
function objectiveStatusToTicketStatus(status: Objective['status']): TicketStatus {
  switch (status) {
    case 'completed': return 'closed';
    case 'archived': return 'rejected';
    default: return 'open';
  }
}

/** Map ForgeFed ticket status to OKR status */
function ticketStatusToObjectiveStatus(status: TicketStatus): Objective['status'] {
  switch (status) {
    case 'closed': return 'completed';
    case 'rejected':
    case 'merged': return 'archived';
    default: return 'active';
  }
}

/** Map OKR priority to ForgeFed ticket priority */
function priorityToTicketPriority(priority: Task['priority']): TicketPriority {
  switch (priority) {
    case 'high': return 'high';
    case 'low': return 'low';
    default: return 'medium';
  }
}

/**
 * Serialize an Objective to a ForgeFed Ticket
 * OKR-013.11 Task 4.11.1
 */
export function serializeObjectiveToTicket(
  objective: ObjectiveModel,
  actorId: string,
  ticketTrackerUrl?: string
): ForgeFedTicket {
  const baseUrl = ticketTrackerUrl ?? 'https://kefine.local';
  const ticketId = objective.apId ?? `${baseUrl}/tickets/${objective.id}`;

  return {
    '@context': [...COMBINED_CONTEXT],
    id: ticketId,
    type: 'Ticket',
    name: objective.title,
    content: objective.description ?? '',
    attributedTo: actorId,
    ticketsTrackedBy: ticketTrackerUrl,
    status: objectiveStatusToTicketStatus(objective.status),
    kind: 'Task' as TicketKind,
    published: objective.createdAt.toISOString(),
    updated: objective.updatedAt.toISOString(),
    'okr:objectiveId': objective.id,
    'okr:quarter': objective.quarter,
    'okr:year': objective.year,
    'okr:status': objective.status
  };
}

/**
 * Deserialize a ForgeFed Ticket to an Objective model
 * OKR-013.11 Task 4.11.2
 */
export function deserializeTicketToObjective(ticket: ForgeFedTicket): Partial<ObjectiveModel> {
  const quarter = (ticket['okr:quarter'] ?? 'Q1') as Objective['quarter'];
  const year = ticket['okr:year'] ?? new Date().getFullYear();

  return {
    id: ticket['okr:objectiveId'] ?? crypto.randomUUID(),
    title: ticket.name ?? 'Untitled Objective',
    description: ticket.content,
    quarter,
    year,
    status: ticket.status ? ticketStatusToObjectiveStatus(ticket.status) : 'active',
    createdAt: ticket.published ? new Date(ticket.published) : new Date(),
    updatedAt: ticket.updated ? new Date(ticket.updated) : new Date(),
    apId: ticket.id,
    ticketTrackerUrl: typeof ticket.ticketsTrackedBy === 'string'
      ? ticket.ticketsTrackedBy
      : ticket.ticketsTrackedBy?.id
  };
}

/**
 * Serialize a KeyResult to a ForgeFed sub-ticket
 * OKR-013.12 Task 4.12.1
 */
export function serializeKeyResultToTicket(
  kr: KeyResultModel,
  actorId: string,
  parentObjectiveTicketId: string,
  ticketTrackerUrl?: string
): ForgeFedTicket {
  const baseUrl = ticketTrackerUrl ?? 'https://kefine.local';
  const ticketId = kr.apId ?? `${baseUrl}/tickets/kr-${kr.id}`;
  const progress = kr.targetValue > 0 ? (kr.currentValue / kr.targetValue) * 100 : 0;

  return {
    '@context': [...COMBINED_CONTEXT],
    id: ticketId,
    type: 'Ticket',
    name: kr.title,
    content: kr.description ?? '',
    attributedTo: actorId,
    inReplyTo: parentObjectiveTicketId,
    ticketsTrackedBy: ticketTrackerUrl,
    kind: 'Task' as TicketKind,
    status: 'open',
    published: kr.createdAt.toISOString(),
    updated: kr.updatedAt.toISOString(),
    'okr:keyResultId': kr.id,
    'okr:objectiveId': kr.objectiveId,
    'okr:targetType': kr.targetType,
    'okr:targetValue': kr.targetValue,
    'okr:currentValue': kr.currentValue,
    'okr:weight': kr.weight,
    summary: `Progress: ${progress.toFixed(1)}% (${kr.currentValue}/${kr.targetValue} ${kr.unit})`
  };
}

/**
 * Serialize a Task to a ForgeFed Ticket
 * OKR-013.13 Task 4.13.1
 */
export function serializeTaskToTicket(
  task: TaskModel,
  actorId: string,
  ticketTrackerUrl?: string
): ForgeFedTicket {
  const baseUrl = ticketTrackerUrl ?? 'https://kefine.local';
  const ticketId = task.apId ?? `${baseUrl}/tickets/task-${task.id}`;

  let status: TicketStatus = 'open';
  if (task.status === 'completed') status = 'closed';

  return {
    '@context': [...COMBINED_CONTEXT],
    id: ticketId,
    type: 'Ticket',
    name: task.title,
    content: task.description ?? '',
    attributedTo: actorId,
    ticketsTrackedBy: ticketTrackerUrl,
    kind: 'Task' as TicketKind,
    status,
    priority: priorityToTicketPriority(task.priority),
    published: task.createdAt.toISOString(),
    updated: task.updatedAt.toISOString()
  };
}

/**
 * Create a ticket comment AP object
 *
 * @param ticketId - The parent ticket ID (URL)
 * @param content - Comment text (Markdown)
 * @param actorId - The commenting actor's ID
 */
export function serializeComment(
  ticketId: string,
  content: string,
  actorId: string
): ForgeFedTicketComment {
  return {
    '@context': [...COMBINED_CONTEXT],
    type: 'Note',
    inReplyTo: ticketId,
    attributedTo: actorId,
    content,
    published: new Date().toISOString()
  };
}

/**
 * Post an Objective to the ActivityPub outbox as a ForgeFed Ticket
 * Implements the Offer/Accept pattern for ticket creation
 *
 * @param objective - The objective to federate
 * @param actorId - The actor posting the ticket
 * @param outboxUrl - The actor's outbox URL
 * @param ticketTrackerUrl - Target TicketTracker URL
 * @returns Location URL of the created activity
 */
export async function federateObjective(
  objective: ObjectiveModel,
  actorId: string,
  outboxUrl: string,
  ticketTrackerUrl: string
): Promise<string> {
  const ticket = serializeObjectiveToTicket(objective, actorId, ticketTrackerUrl);

  // Use Offer activity for ticket creation (ForgeFed pattern)
  const offerActivity: Omit<ActivityPubActivity, 'id'> = {
    '@context': [...COMBINED_CONTEXT],
    type: 'Offer',
    actor: actorId,
    to: [ticketTrackerUrl],
    object: ticket,
    target: ticketTrackerUrl,
    published: new Date().toISOString()
  };

  return postToOutbox(outboxUrl, offerActivity);
}

/**
 * Post an update to a federated Objective ticket
 *
 * @param objective - The updated objective (must have apId)
 * @param actorId - The actor performing the update
 * @param outboxUrl - The actor's outbox URL
 * @returns Location URL of the created Update activity
 */
export async function federateObjectiveUpdate(
  objective: ObjectiveModel & { apId: string },
  actorId: string,
  outboxUrl: string
): Promise<string> {
  const ticket = serializeObjectiveToTicket(objective, actorId);
  const ticketWithId = { ...ticket, id: objective.apId };
  const activity = buildUpdateActivity(actorId, ticketWithId);
  return postToOutbox(outboxUrl, activity);
}

/**
 * Post a new KeyResult as a sub-ticket
 *
 * @param kr - The key result to federate
 * @param actorId - The actor posting
 * @param outboxUrl - The actor's outbox URL
 * @param parentTicketId - The parent objective's AP ticket ID
 * @param ticketTrackerUrl - Target TicketTracker URL
 */
export async function federateKeyResult(
  kr: KeyResultModel,
  actorId: string,
  outboxUrl: string,
  parentTicketId: string,
  ticketTrackerUrl: string
): Promise<string> {
  const ticket = serializeKeyResultToTicket(kr, actorId, parentTicketId, ticketTrackerUrl);
  const activity = buildCreateActivity(actorId, ticket, [ticketTrackerUrl]);
  return postToOutbox(outboxUrl, activity);
}
