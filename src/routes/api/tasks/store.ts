import type { ApiTask } from '$lib/api/types';

// In-memory store for tasks (shared between route handlers)
// Replace with database persistence in production
export const tasks: ApiTask[] = [];
