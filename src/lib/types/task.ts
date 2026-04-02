export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'blocked';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId?: string;
  projectId?: string;
  parentTaskId?: string;
  tags: string[];
  dueDate?: string;
  estimatedHours?: number;
  actualHours?: number;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, unknown>;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string;
  projectId?: string;
  parentTaskId?: string;
  tags?: string[];
  dueDate?: string;
  estimatedHours?: number;
  metadata?: Record<string, unknown>;
}

export type UpdateTaskRequest = Partial<CreateTaskRequest>;
