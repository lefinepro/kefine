import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { ApiTask, UpdateTaskRequest, SingleResponse } from '$lib/api/types';

// Shared in-memory store (same reference as parent route)
// In production this would be a database call
import { tasks } from '../store';

export const GET: RequestHandler = ({ params }) => {
  const task = tasks.find((t) => t.id === params.id);
  if (!task) {
    return json({ error: 'not_found', message: 'Task not found', statusCode: 404 }, { status: 404 });
  }
  const response: SingleResponse<ApiTask> = { data: task };
  return json(response);
};

export const PUT: RequestHandler = async ({ params, request }) => {
  const idx = tasks.findIndex((t) => t.id === params.id);
  if (idx === -1) {
    return json({ error: 'not_found', message: 'Task not found', statusCode: 404 }, { status: 404 });
  }

  const body = (await request.json()) as UpdateTaskRequest;
  const existing = tasks[idx] as ApiTask;
  const updated: ApiTask = {
    ...existing,
    ...(body.title !== undefined ? { title: body.title } : {}),
    ...(body.description !== undefined ? { description: body.description } : {}),
    ...(body.status !== undefined ? { status: body.status } : {}),
    ...(body.priority !== undefined ? { priority: body.priority } : {}),
    updatedAt: new Date().toISOString()
  };
  tasks[idx] = updated;

  const response: SingleResponse<ApiTask> = { data: updated };
  return json(response);
};

export const DELETE: RequestHandler = ({ params }) => {
  const idx = tasks.findIndex((t) => t.id === params.id);
  if (idx === -1) {
    return json({ error: 'not_found', message: 'Task not found', statusCode: 404 }, { status: 404 });
  }
  tasks.splice(idx, 1);
  return new Response(null, { status: 204 });
};
