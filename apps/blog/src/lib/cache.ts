// ---------------------------------------------------------------------------
// In-memory caching layer
// ---------------------------------------------------------------------------

export interface CacheEntry<T> {
  data: T;
  expiresAt: number;
  createdAt: number;
}

export class MemoryCache {
  private store = new Map<string, CacheEntry<unknown>>();
  private hits = 0;
  private misses = 0;

  /** Retrieve a cached value. Returns `null` if missing or expired. */
  get<T>(key: string): T | null {
    const entry = this.store.get(key);

    if (!entry) {
      this.misses++;
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      this.misses++;
      return null;
    }

    this.hits++;
    return entry.data as T;
  }

  /** Store a value with a TTL in seconds. */
  set<T>(key: string, data: T, ttlSeconds: number): void {
    // Evict expired entries periodically (every 100 writes)
    if (this.store.size % 100 === 0) {
      this.evictExpired();
    }

    const now = Date.now();
    this.store.set(key, {
      data,
      expiresAt: now + ttlSeconds * 1000,
      createdAt: now,
    });
  }

  /** Remove a specific key. */
  delete(key: string): void {
    this.store.delete(key);
  }

  /** Clear all entries. */
  clear(): void {
    this.store.clear();
    this.hits = 0;
    this.misses = 0;
  }

  /** Number of entries currently stored (including potentially expired). */
  size(): number {
    return this.store.size;
  }

  /** Return cache hit/miss statistics. */
  getStats(): { hits: number; misses: number; hitRate: number; size: number } {
    const total = this.hits + this.misses;
    return {
      hits: this.hits,
      misses: this.misses,
      hitRate: total === 0 ? 0 : this.hits / total,
      size: this.store.size,
    };
  }

  /** Remove all expired entries from the store. */
  private evictExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.store) {
      if (now > entry.expiresAt) {
        this.store.delete(key);
      }
    }
  }
}

/** Global singleton cache instance. */
export const cache = new MemoryCache();

// ---------------------------------------------------------------------------
// Cache-or-compute helper
// ---------------------------------------------------------------------------

/**
 * Returns cached data for `key` if available, otherwise calls `fn`, caches
 * the result for `ttl` seconds, and returns it.
 */
export async function withCache<T>(
  key: string,
  ttl: number,
  fn: () => Promise<T>,
): Promise<T> {
  const cached = cache.get<T>(key);
  if (cached !== null) return cached;

  const data = await fn();
  cache.set(key, data, ttl);
  return data;
}
