import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { ApiTask, CreateTaskRequest, ListResponse, SingleResponse } from '$lib/api/types';
import { tasks } from './store';

export const GET: RequestHandler = () => {
  const response: ListResponse<ApiTask> = {
    data: tasks,
    pagination: {
      page: 1,
      pageSize: tasks.length,
      total: tasks.length
    }
  };
  return json(response);
};

export const POST: RequestHandler = async ({ request }) => {
  const body = (await request.json()) as CreateTaskRequest;

  if (!body.title) {
    return json({ error: 'validation_error', message: 'title is required', statusCode: 400 }, { status: 400 });
  }

  const now = new Date().toISOString();
  const task: ApiTask = {
    id: crypto.randomUUID(),
    title: body.title,
    description: body.description,
    status: body.status ?? 'pending',
    priority: body.priority ?? 'medium',
    createdAt: now,
    updatedAt: now
  };

  tasks.push(task);

  const response: SingleResponse<ApiTask> = { data: task };
  return json(response, { status: 201 });
};
