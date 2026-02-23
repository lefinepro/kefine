import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { ApiComment, CreateCommentRequest, SingleResponse } from '$lib/api/types';
import { tickets, comments } from '../../store';

export const POST: RequestHandler = async ({ params, request }) => {
  const ticket = tickets.find((t) => t.id === params.id);
  if (!ticket) {
    return json(
      { error: 'not_found', message: 'Ticket not found', statusCode: 404 },
      { status: 404 }
    );
  }

  const body = (await request.json()) as CreateCommentRequest;

  if (!body.content) {
    return json(
      { error: 'validation_error', message: 'content is required', statusCode: 400 },
      { status: 400 }
    );
  }

  const now = new Date().toISOString();
  const comment: ApiComment = {
    id: crypto.randomUUID(),
    ticketId: params.id,
    content: body.content,
    createdAt: now,
    updatedAt: now
  };

  comments.push(comment);

  const response: SingleResponse<ApiComment> = { data: comment };
  return json(response, { status: 201 });
};
