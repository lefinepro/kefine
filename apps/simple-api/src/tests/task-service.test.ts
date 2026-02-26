import { describe, it, expect } from 'vitest';
import { TaskService } from '../services/task.js';

describe('TaskService', () => {
  it('creates a task with defaults', async () => {
    const service = new TaskService();
    const task = await service.create({ title: 'Test Task' });

    expect(task.id).toBeTruthy();
    expect(task.title).toBe('Test Task');
    expect(task.status).toBe('todo');
    expect(task.priority).toBe('medium');
    expect(task.tags).toEqual([]);
    expect(task.createdAt).toBeTruthy();
    expect(task.updatedAt).toBeTruthy();
  });

  it('creates a task with custom fields', async () => {
    const service = new TaskService();
    const task = await service.create({
      title: 'Bug Fix',
      status: 'in_progress',
      priority: 'high',
      tags: ['backend', 'critical'],
    });

    expect(task.status).toBe('in_progress');
    expect(task.priority).toBe('high');
    expect(task.tags).toEqual(['backend', 'critical']);
  });

  it('retrieves a task by id', async () => {
    const service = new TaskService();
    const created = await service.create({ title: 'Find Me' });
    const found = await service.getById(created.id);

    expect(found).toBeDefined();
    expect(found?.title).toBe('Find Me');
  });

  it('returns undefined for missing task id', async () => {
    const service = new TaskService();
    const found = await service.getById('nonexistent-id');
    expect(found).toBeUndefined();
  });

  it('lists tasks with pagination', async () => {
    const service = new TaskService();
    for (let i = 0; i < 5; i++) {
      await service.create({ title: `Task ${i}` });
    }

    const page1 = await service.list({ page: 1, pageSize: 3 });
    expect(page1.data).toHaveLength(3);
    expect(page1.meta.total).toBe(5);
    expect(page1.meta.totalPages).toBe(2);

    const page2 = await service.list({ page: 2, pageSize: 3 });
    expect(page2.data).toHaveLength(2);
  });

  it('filters tasks by status', async () => {
    const service = new TaskService();
    await service.create({ title: 'Todo Task', status: 'todo' });
    await service.create({ title: 'Done Task', status: 'done' });

    const result = await service.list({ page: 1, pageSize: 20, status: 'done' });
    expect(result.data).toHaveLength(1);
    expect(result.data[0]?.title).toBe('Done Task');
  });

  it('filters tasks by priority', async () => {
    const service = new TaskService();
    await service.create({ title: 'Low Task', priority: 'low' });
    await service.create({ title: 'High Task', priority: 'high' });

    const result = await service.list({ page: 1, pageSize: 20, priority: 'high' });
    expect(result.data).toHaveLength(1);
    expect(result.data[0]?.title).toBe('High Task');
  });

  it('updates a task', async () => {
    const service = new TaskService();
    const task = await service.create({ title: 'Original' });
    const updated = await service.update(task.id, { title: 'Updated', status: 'done' });

    expect(updated).toBeDefined();
    expect(updated?.title).toBe('Updated');
    expect(updated?.status).toBe('done');
    expect(updated?.updatedAt).not.toBe(task.updatedAt);
  });

  it('returns undefined when updating non-existent task', async () => {
    const service = new TaskService();
    const result = await service.update('nonexistent', { title: 'New' });
    expect(result).toBeUndefined();
  });

  it('deletes a task', async () => {
    const service = new TaskService();
    const task = await service.create({ title: 'Delete Me' });
    const deleted = await service.delete(task.id);

    expect(deleted).toBe(true);
    expect(await service.getById(task.id)).toBeUndefined();
  });

  it('returns false when deleting non-existent task', async () => {
    const service = new TaskService();
    const result = await service.delete('nonexistent');
    expect(result).toBe(false);
  });
});
