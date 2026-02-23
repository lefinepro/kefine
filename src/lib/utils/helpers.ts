import type { Quarter } from '$lib/types/okr';

/**
 * Get quarter from a date
 */
export function getQuarterFromDate(date: Date): Quarter {
  const month = date.getMonth();
  if (month < 3) return 'Q1';
  if (month < 6) return 'Q2';
  if (month < 9) return 'Q3';
  return 'Q4';
}

/**
 * Get current quarter and year
 */
export function getCurrentQuarter(): { quarter: Quarter; year: number } {
  const now = new Date();
  return {
    quarter: getQuarterFromDate(now),
    year: now.getFullYear()
  };
}

/**
 * Get list of quarters for dropdown
 */
export function getQuartersList(): { value: string; label: string }[] {
  return [
    { value: 'Q1', label: 'Q1 - Jan to Mar' },
    { value: 'Q2', label: 'Q2 - Apr to Jun' },
    { value: 'Q3', label: 'Q3 - Jul to Sep' },
    { value: 'Q4', label: 'Q4 - Oct to Dec' }
  ];
}

/**
 * Get list of years for dropdown
 */
export function getYearsList(startYear?: number, endYear?: number): number[] {
  const current = new Date().getFullYear();
  const start = startYear ?? current - 2;
  const end = endYear ?? current + 3;
  const years: number[] = [];
  for (let year = start; year <= end; year++) {
    years.push(year);
  }
  return years;
}

/**
 * Generate unique ID — falls back to Math.random when crypto.randomUUID is unavailable
 * (e.g. non-secure HTTP contexts in development)
 */
export function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback: RFC 4122 v4-like UUID using Math.random
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
