import type { ApiTicket, ApiComment } from '$lib/api/types';

// In-memory stores for tickets and comments (shared between route handlers)
// Replace with database persistence in production
export const tickets: ApiTicket[] = [];
export const comments: ApiComment[] = [];
