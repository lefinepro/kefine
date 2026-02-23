import { randomUUID } from 'crypto';
import type { Task, CreateTaskRequest, UpdateTaskRequest, ListResponse } from '@kefine/types';

interface ListOptions {
  page: number;
  pageSize: number;
  status?: string;
  priority?: string;
}

export class TaskService {
  private readonly tasks: Map<string, Task> = new Map();

  async list(options: ListOptions): Promise<ListResponse<Task>> {
    let items = Array.from(this.tasks.values());

    if (options.status !== undefined) {
      items = items.filter((t) => t.status === options.status);
    }

    if (options.priority !== undefined) {
      items = items.filter((t) => t.priority === options.priority);
    }

    const total = items.length;
    const start = (options.page - 1) * options.pageSize;
    const paginated = items.slice(start, start + options.pageSize);

    return {
      data: paginated,
      meta: {
        total,
        page: options.page,
        pageSize: options.pageSize,
        totalPages: Math.ceil(total / options.pageSize),
        requestId: '',
        timestamp: new Date().toISOString(),
      },
    };
  }

  async getById(id: string): Promise<Task | undefined> {
    return this.tasks.get(id);
  }

  async create(data: CreateTaskRequest): Promise<Task> {
    const now = new Date().toISOString();
    const task: Task = {
      id: randomUUID(),
      title: data.title,
      description: data.description,
      status: data.status ?? 'todo',
      priority: data.priority ?? 'medium',
      assigneeId: data.assigneeId,
      projectId: data.projectId,
      parentTaskId: data.parentTaskId,
      tags: data.tags ?? [],
      dueDate: data.dueDate,
      estimatedHours: data.estimatedHours,
      metadata: data.metadata,
      createdAt: now,
      updatedAt: now,
    };
    this.tasks.set(task.id, task);
    return task;
  }

  async update(id: string, updates: UpdateTaskRequest): Promise<Task | undefined> {
    const task = this.tasks.get(id);
    if (task === undefined) return undefined;

    const updated: Task = {
      ...task,
      ...updates,
      tags: updates.tags ?? task.tags,
      updatedAt: new Date().toISOString(),
    };
    this.tasks.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    return this.tasks.delete(id);
  }
}
