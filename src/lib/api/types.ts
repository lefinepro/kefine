// Simple Task API - Type Definitions
// Used by both main app and Crater proxy service

export type TicketKind = 'bug' | 'feature' | 'support' | 'task' | 'review';
export type TicketStatus = 'open' | 'closed' | 'merged' | 'rejected';
export type TicketPriority = 'low' | 'medium' | 'high' | 'critical';

export interface ApiTask {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  updatedAt: string;
}

export interface ApiTicket {
  id: string;
  kind: TicketKind;
  title: string;
  content?: string;
  status: TicketStatus;
  priority: TicketPriority;
  labels?: string[];
  assigneeId?: string;
  reporterId?: string;
  milestone?: string;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiComment {
  id: string;
  ticketId: string;
  content: string;
  authorId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  status?: 'pending' | 'in_progress' | 'completed';
  priority?: 'low' | 'medium' | 'high';
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  status?: 'pending' | 'in_progress' | 'completed';
  priority?: 'low' | 'medium' | 'high';
}

export interface CreateTicketRequest {
  kind: TicketKind;
  title: string;
  content?: string;
  priority?: TicketPriority;
  labels?: string[];
  assigneeId?: string;
  milestone?: string;
  dueDate?: string;
}

export interface UpdateTicketRequest {
  title?: string;
  content?: string;
  status?: TicketStatus;
  priority?: TicketPriority;
  assigneeId?: string;
  labels?: string[];
  milestone?: string;
}

export interface CreateCommentRequest {
  content: string;
}

export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
}

export interface ListResponse<T> {
  data: T[];
  pagination: Pagination;
}

export interface SingleResponse<T> {
  data: T;
}

export interface ErrorResponse {
  error: string;
  message: string;
  statusCode: number;
}
