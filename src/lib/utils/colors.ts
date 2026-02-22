import type { ObjectiveStatus, Priority, TargetType } from '$lib/types/okr';

/**
 * Get color based on status
 */
export function getStatusColor(status: ObjectiveStatus): string {
  switch (status) {
    case 'active':
      return '#22c55e'; // green-500
    case 'completed':
      return '#3b82f6'; // blue-500
    case 'archived':
      return '#6b7280'; // gray-500
    default:
      return '#6b7280';
  }
}

/**
 * Get color based on priority
 */
export function getPriorityColor(priority: Priority): string {
  switch (priority) {
    case 'high':
      return '#ef4444'; // red-500
    case 'medium':
      return '#f59e0b'; // amber-500
    case 'low':
      return '#22c55e'; // green-500
    default:
      return '#6b7280';
  }
}

/**
 * Get color based on progress percentage
 */
export function getProgressColor(percentage: number): string {
  if (percentage >= 75) {
    return '#22c55e'; // green-500
  }
  if (percentage >= 50) {
    return '#3b82f6'; // blue-500
  }
  if (percentage >= 25) {
    return '#f59e0b'; // amber-500
  }
  return '#ef4444'; // red-500
}

/**
 * Get color based on target type
 */
export function getTargetTypeColor(targetType: TargetType): string {
  switch (targetType) {
    case 'number':
      return '#8b5cf6'; // violet-500
    case 'percentage':
      return '#06b6d4'; // cyan-500
    case 'boolean':
      return '#ec4899'; // pink-500
    default:
      return '#6b7280';
  }
}
