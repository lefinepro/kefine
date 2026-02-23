import { Router } from 'express';
import type { CreateTaskRequest, TaskStatus, TaskPriority } from '@kefine/types';
import { TaskService } from '../services/task.js';
import { ApiError } from '../middleware/error.js';
import type { RequestWithId } from '../middleware/logger.js';

const router = Router();
const taskService = new TaskService();

const VALID_STATUSES: readonly TaskStatus[] = ['todo', 'in_progress', 'done', 'blocked'];
const VALID_PRIORITIES: readonly TaskPriority[] = ['low', 'medium', 'high', 'critical'];

function isValidStatus(s: string): s is TaskStatus {
  return (VALID_STATUSES as readonly string[]).includes(s);
}

function isValidPriority(p: string): p is TaskPriority {
  return (VALID_PRIORITIES as readonly string[]).includes(p);
}

function getRequestMeta(req: RequestWithId) {
  return {
    requestId: req.requestId,
    timestamp: new Date().toISOString(),
  };
}

// GET /api/tasks
router.get('/', async (req, res, next) => {
  try {
    const { page = '1', pageSize = '20', status, priority } = req.query as Record<string, string | undefined>;

    const parsedPage = parseInt(page, 10);
    const parsedPageSize = parseInt(pageSize, 10);

    if (isNaN(parsedPage) || parsedPage < 1) {
      throw new ApiError('VALIDATION_ERROR', 400, 'page must be a positive integer');
    }
    if (isNaN(parsedPageSize) || parsedPageSize < 1 || parsedPageSize > 100) {
      throw new ApiError('VALIDATION_ERROR', 400, 'pageSize must be between 1 and 100');
    }
    if (status !== undefined && !isValidStatus(status)) {
      throw new ApiError('VALIDATION_ERROR', 400, `status must be one of: ${VALID_STATUSES.join(', ')}`);
    }
    if (priority !== undefined && !isValidPriority(priority)) {
      throw new ApiError('VALIDATION_ERROR', 400, `priority must be one of: ${VALID_PRIORITIES.join(', ')}`);
    }

    const result = await taskService.list({
      page: parsedPage,
      pageSize: parsedPageSize,
      status,
      priority,
    });

    const typedReq = req as unknown as RequestWithId;
    result.meta.requestId = typedReq.requestId;
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// GET /api/tasks/:id
router.get('/:id', async (req, res, next) => {
  try {
    const task = await taskService.getById(req.params.id);

    if (task === undefined) {
      throw new ApiError('NOT_FOUND', 404, 'Task not found');
    }

    res.json({ data: task, meta: getRequestMeta(req as unknown as RequestWithId) });
  } catch (error) {
    next(error);
  }
});

// POST /api/tasks
router.post('/', async (req, res, next) => {
  try {
    const body = req.body as Record<string, unknown>;

    if (typeof body.title !== 'string' || body.title.trim() === '') {
      throw new ApiError('VALIDATION_ERROR', 400, 'title is required and must be a non-empty string');
    }

    if (body.status !== undefined && !isValidStatus(body.status as string)) {
      throw new ApiError('VALIDATION_ERROR', 400, `status must be one of: ${VALID_STATUSES.join(', ')}`);
    }

    if (body.priority !== undefined && !isValidPriority(body.priority as string)) {
      throw new ApiError('VALIDATION_ERROR', 400, `priority must be one of: ${VALID_PRIORITIES.join(', ')}`);
    }

    const createData: CreateTaskRequest = {
      title: (body.title as string).trim(),
      description: typeof body.description === 'string' ? body.description : undefined,
      status: body.status as TaskStatus | undefined,
      priority: body.priority as TaskPriority | undefined,
      assigneeId: typeof body.assigneeId === 'string' ? body.assigneeId : undefined,
      projectId: typeof body.projectId === 'string' ? body.projectId : undefined,
      parentTaskId: typeof body.parentTaskId === 'string' ? body.parentTaskId : undefined,
      tags: Array.isArray(body.tags) ? (body.tags as string[]) : undefined,
      dueDate: typeof body.dueDate === 'string' ? body.dueDate : undefined,
      estimatedHours: typeof body.estimatedHours === 'number' ? body.estimatedHours : undefined,
      metadata: typeof body.metadata === 'object' && body.metadata !== null
        ? (body.metadata as Record<string, unknown>)
        : undefined,
    };

    const task = await taskService.create(createData);

    res.status(201).json({
      data: task,
      meta: getRequestMeta(req as unknown as RequestWithId),
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/tasks/:id
router.put('/:id', async (req, res, next) => {
  try {
    const body = req.body as Record<string, unknown>;

    if (body.status !== undefined && !isValidStatus(body.status as string)) {
      throw new ApiError('VALIDATION_ERROR', 400, `status must be one of: ${VALID_STATUSES.join(', ')}`);
    }

    if (body.priority !== undefined && !isValidPriority(body.priority as string)) {
      throw new ApiError('VALIDATION_ERROR', 400, `priority must be one of: ${VALID_PRIORITIES.join(', ')}`);
    }

    const task = await taskService.update(req.params.id, {
      title: typeof body.title === 'string' ? body.title.trim() : undefined,
      description: typeof body.description === 'string' ? body.description : undefined,
      status: body.status as TaskStatus | undefined,
      priority: body.priority as TaskPriority | undefined,
      assigneeId: typeof body.assigneeId === 'string' ? body.assigneeId : undefined,
      projectId: typeof body.projectId === 'string' ? body.projectId : undefined,
      parentTaskId: typeof body.parentTaskId === 'string' ? body.parentTaskId : undefined,
      tags: Array.isArray(body.tags) ? (body.tags as string[]) : undefined,
      dueDate: typeof body.dueDate === 'string' ? body.dueDate : undefined,
      estimatedHours: typeof body.estimatedHours === 'number' ? body.estimatedHours : undefined,
      metadata: typeof body.metadata === 'object' && body.metadata !== null
        ? (body.metadata as Record<string, unknown>)
        : undefined,
    });

    if (task === undefined) {
      throw new ApiError('NOT_FOUND', 404, 'Task not found');
    }

    res.json({ data: task, meta: getRequestMeta(req as unknown as RequestWithId) });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/tasks/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const deleted = await taskService.delete(req.params.id);

    if (!deleted) {
      throw new ApiError('NOT_FOUND', 404, 'Task not found');
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export { router as taskRoutes };
