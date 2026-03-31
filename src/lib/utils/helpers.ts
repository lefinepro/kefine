type Quarter = 'Q1' | 'Q2' | 'Q3' | 'Q4';

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

function createAbortError(): Error {
  try {
    return new DOMException('Operation aborted.', 'AbortError');
  } catch {
    return new Error('Operation aborted.');
  }
}

export function scheduleAfter(delayMs: number, callback: () => void): () => void {
  if (typeof requestAnimationFrame !== 'function') {
    callback();
    return () => {};
  }

  let frameId = 0;
  let startTs: number | null = null;
  let cancelled = false;

  const tick = (timestamp: number) => {
    if (cancelled) return;

    if (startTs === null) {
      startTs = timestamp;
    }

    if (timestamp - startTs >= delayMs) {
      callback();
      return;
    }

    frameId = requestAnimationFrame(tick);
  };

  frameId = requestAnimationFrame(tick);

  return () => {
    cancelled = true;
    cancelAnimationFrame(frameId);
  };
}

export function waitForDelay(delayMs: number, signal?: AbortSignal): Promise<void> {
  if (signal?.aborted) {
    return Promise.reject(createAbortError());
  }

  return new Promise<void>((resolve, reject) => {
    let cancel = () => {};

    const handleAbort = () => {
      cancel();
      reject(createAbortError());
    };

    cancel = scheduleAfter(delayMs, () => {
      signal?.removeEventListener('abort', handleAbort);
      resolve();
    });

    signal?.addEventListener('abort', handleAbort, { once: true });
  });
}

export function raceWithDeadline<T>(
  promise: Promise<T>,
  timeoutMs: number,
  message: string
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const cancel = scheduleAfter(timeoutMs, () => {
      reject(new Error(message));
    });

    promise.then(
      (value) => {
        cancel();
        resolve(value);
      },
      (error) => {
        cancel();
        reject(error);
      }
    );
  });
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let cancelScheduled: (() => void) | null = null;
  return (...args: Parameters<T>) => {
    cancelScheduled?.();
    cancelScheduled = scheduleAfter(wait, () => {
      cancelScheduled = null;
      func(...args);
    });
  };
}
