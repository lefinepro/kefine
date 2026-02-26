/**
 * LRU object cache for ActivityPub objects
 * OKR-013.10 Task 3.10.2
 *
 * Prevents redundant fetches by caching fetched ActivityPub objects.
 */

import type { ActivityPubObject } from '../../types/activitypub';

interface CacheEntry<T> {
  value: T;
  insertedAt: number;
  expiresAt: number;
}

/**
 * Simple LRU (Least Recently Used) cache with TTL support
 */
export class ObjectCache<T extends ActivityPubObject> {
  private readonly cache = new Map<string, CacheEntry<T>>();
  private readonly maxSize: number;
  private readonly ttlMs: number;

  constructor(options: { maxSize?: number; ttlMs?: number } = {}) {
    this.maxSize = options.maxSize ?? 200;
    this.ttlMs = options.ttlMs ?? 5 * 60 * 1000; // 5 minutes default
  }

  /** Get an object from the cache, or undefined if not present / expired */
  get(id: string): T | undefined {
    const entry = this.cache.get(id);
    if (!entry) return undefined;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(id);
      return undefined;
    }

    // Move to end of Map to mark as recently used
    this.cache.delete(id);
    this.cache.set(id, entry);
    return entry.value;
  }

  /** Store an object in the cache */
  set(id: string, value: T): void {
    // Evict oldest entry if at capacity
    if (this.cache.size >= this.maxSize && !this.cache.has(id)) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }

    const now = Date.now();
    this.cache.set(id, {
      value,
      insertedAt: now,
      expiresAt: now + this.ttlMs
    });
  }

  /** Invalidate a cached object */
  invalidate(id: string): void {
    this.cache.delete(id);
  }

  /** Clear all cached objects */
  clear(): void {
    this.cache.clear();
  }

  /** Purge all expired entries */
  purgeExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  /** Check if an entry exists and is valid */
  has(id: string): boolean {
    return this.get(id) !== undefined;
  }

  /** Number of cached items */
  get size(): number {
    return this.cache.size;
  }
}

/** Shared global AP object cache */
export const apObjectCache = new ObjectCache({ maxSize: 500, ttlMs: 10 * 60 * 1000 });
