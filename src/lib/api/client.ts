// Simple Task API Client
// Communicates with SvelteKit API routes

import type {
  ApiTask,
  ApiTicket,
  ApiComment,
  CreateTaskRequest,
  UpdateTaskRequest,
  CreateTicketRequest,
  UpdateTicketRequest,
  CreateCommentRequest,
  ListResponse,
  SingleResponse
} from './types';

const API_BASE = '/api';

async function request<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers
    },
    ...options
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message ?? `HTTP ${response.status}`);
  }

  return response.json() as Promise<T>;
}

// Task API

export async function fetchTasks(): Promise<ListResponse<ApiTask>> {
  return request<ListResponse<ApiTask>>('/tasks');
}

export async function fetchTask(id: string): Promise<SingleResponse<ApiTask>> {
  return request<SingleResponse<ApiTask>>(`/tasks/${id}`);
}

export async function createTask(task: CreateTaskRequest): Promise<SingleResponse<ApiTask>> {
  return request<SingleResponse<ApiTask>>('/tasks', {
    method: 'POST',
    body: JSON.stringify(task)
  });
}

export async function updateTask(
  id: string,
  task: UpdateTaskRequest
): Promise<SingleResponse<ApiTask>> {
  return request<SingleResponse<ApiTask>>(`/tasks/${id}`, {
    method: 'PUT',
    body: JSON.stringify(task)
  });
}

export async function deleteTask(id: string): Promise<void> {
  await request<void>(`/tasks/${id}`, { method: 'DELETE' });
}

// Ticket API

export async function fetchTickets(): Promise<ListResponse<ApiTicket>> {
  return request<ListResponse<ApiTicket>>('/tickets');
}

export async function fetchTicket(id: string): Promise<SingleResponse<ApiTicket>> {
  return request<SingleResponse<ApiTicket>>(`/tickets/${id}`);
}

export async function createTicket(ticket: CreateTicketRequest): Promise<SingleResponse<ApiTicket>> {
  return request<SingleResponse<ApiTicket>>('/tickets', {
    method: 'POST',
    body: JSON.stringify(ticket)
  });
}

export async function updateTicket(
  id: string,
  ticket: UpdateTicketRequest
): Promise<SingleResponse<ApiTicket>> {
  return request<SingleResponse<ApiTicket>>(`/tickets/${id}`, {
    method: 'PUT',
    body: JSON.stringify(ticket)
  });
}

export async function deleteTicket(id: string): Promise<void> {
  await request<void>(`/tickets/${id}`, { method: 'DELETE' });
}

export async function addComment(
  ticketId: string,
  comment: CreateCommentRequest
): Promise<SingleResponse<ApiComment>> {
  return request<SingleResponse<ApiComment>>(`/tickets/${ticketId}/comments`, {
    method: 'POST',
    body: JSON.stringify(comment)
  });
}
