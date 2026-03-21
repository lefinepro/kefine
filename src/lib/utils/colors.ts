import type { ObjectiveStatus, Priority, TargetType } from '$lib/types/okr';

/**
 * Get color based on status
 */
export function getStatusColor(status: ObjectiveStatus): string {
  switch (status) {
    case 'active':
      return 'var(--okr-color-success)';
    case 'completed':
      return 'var(--okr-color-primary)';
    case 'archived':
      return 'var(--okr-color-text-tertiary)';
    default:
      return 'var(--okr-color-text-tertiary)';
  }
}

/**
 * Get color based on priority
 */
export function getPriorityColor(priority: Priority): string {
  switch (priority) {
    case 'high':
      return 'var(--okr-color-error)';
    case 'medium':
      return 'var(--okr-color-warning)';
    case 'low':
      return 'var(--okr-color-success)';
    default:
      return 'var(--okr-color-text-tertiary)';
  }
}

/**
 * Get color based on progress percentage.
 * Thresholds per OKR-006 spec:
 * >80%: green (success), 50-80%: orange (warning), <50%: red (danger)
 */
export function getProgressColor(percentage: number): string {
  if (percentage > 80) {
    return 'var(--okr-color-success)';
  }
  if (percentage >= 50) {
    return 'var(--okr-color-warning)';
  }
  return 'var(--okr-color-error)';
}

/**
 * Get color based on target type
 */
export function getTargetTypeColor(targetType: TargetType): string {
  switch (targetType) {
    case 'number':
      return 'var(--okr-color-primary)';
    case 'percentage':
      return 'var(--okr-color-warning)';
    case 'boolean':
      return 'var(--okr-color-success)';
    default:
      return 'var(--okr-color-text-tertiary)';
  }
}
