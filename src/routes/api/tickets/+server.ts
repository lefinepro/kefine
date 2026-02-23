import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { ApiTicket, CreateTicketRequest, ListResponse, SingleResponse } from '$lib/api/types';
import { tickets } from './store';

export const GET: RequestHandler = () => {
  const response: ListResponse<ApiTicket> = {
    data: tickets,
    pagination: {
      page: 1,
      pageSize: tickets.length,
      total: tickets.length
    }
  };
  return json(response);
};

export const POST: RequestHandler = async ({ request }) => {
  const body = (await request.json()) as CreateTicketRequest;

  if (!body.title) {
    return json(
      { error: 'validation_error', message: 'title is required', statusCode: 400 },
      { status: 400 }
    );
  }

  if (!body.kind) {
    return json(
      { error: 'validation_error', message: 'kind is required', statusCode: 400 },
      { status: 400 }
    );
  }

  const now = new Date().toISOString();
  const ticket: ApiTicket = {
    id: crypto.randomUUID(),
    kind: body.kind,
    title: body.title,
    content: body.content,
    status: 'open',
    priority: body.priority ?? 'medium',
    labels: body.labels ?? [],
    assigneeId: body.assigneeId,
    milestone: body.milestone,
    dueDate: body.dueDate,
    createdAt: now,
    updatedAt: now
  };

  tickets.push(ticket);

  const response: SingleResponse<ApiTicket> = { data: ticket };
  return json(response, { status: 201 });
};
