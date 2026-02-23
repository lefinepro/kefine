import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { ApiTicket, UpdateTicketRequest, SingleResponse } from '$lib/api/types';
import { tickets } from '../store';

export const GET: RequestHandler = ({ params }) => {
  const ticket = tickets.find((t) => t.id === params.id);
  if (!ticket) {
    return json(
      { error: 'not_found', message: 'Ticket not found', statusCode: 404 },
      { status: 404 }
    );
  }
  const response: SingleResponse<ApiTicket> = { data: ticket };
  return json(response);
};

export const PUT: RequestHandler = async ({ params, request }) => {
  const idx = tickets.findIndex((t) => t.id === params.id);
  if (idx === -1) {
    return json(
      { error: 'not_found', message: 'Ticket not found', statusCode: 404 },
      { status: 404 }
    );
  }

  const body = (await request.json()) as UpdateTicketRequest;
  const existing = tickets[idx] as ApiTicket;
  const updated: ApiTicket = {
    ...existing,
    ...(body.title !== undefined ? { title: body.title } : {}),
    ...(body.content !== undefined ? { content: body.content } : {}),
    ...(body.status !== undefined ? { status: body.status } : {}),
    ...(body.priority !== undefined ? { priority: body.priority } : {}),
    ...(body.assigneeId !== undefined ? { assigneeId: body.assigneeId } : {}),
    ...(body.labels !== undefined ? { labels: body.labels } : {}),
    ...(body.milestone !== undefined ? { milestone: body.milestone } : {}),
    updatedAt: new Date().toISOString()
  };
  tickets[idx] = updated;

  const response: SingleResponse<ApiTicket> = { data: updated };
  return json(response);
};

export const DELETE: RequestHandler = ({ params }) => {
  const idx = tickets.findIndex((t) => t.id === params.id);
  if (idx === -1) {
    return json(
      { error: 'not_found', message: 'Ticket not found', statusCode: 404 },
      { status: 404 }
    );
  }
  tickets.splice(idx, 1);
  return new Response(null, { status: 204 });
};
