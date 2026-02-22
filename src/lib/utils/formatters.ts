import type { Quarter, ObjectiveStatus } from '$lib/types/okr';

/**
 * Format quarter and year to readable string
 */
export function formatQuarter(quarter: Quarter, year: number): string {
  return `${quarter} ${year}`;
}

/**
 * Format progress value to percentage string
 */
export function formatProgress(value: number, decimals = 0): string {
  const clamped = Math.max(0, Math.min(100, value));
  return `${clamped.toFixed(decimals)}%`;
}

/**
 * Format status string with capitalization
 */
export function formatStatus(status: ObjectiveStatus): string {
  return status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');
}

/**
 * Format date to locale string
 */
export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Format number with unit
 */
export function formatValue(value: number, unit: string): string {
  return `${value}${unit}`;
}
