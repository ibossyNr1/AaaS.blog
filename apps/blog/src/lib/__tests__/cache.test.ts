import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryCache, withCache } from '@/lib/cache';

describe('MemoryCache', () => {
  let cache: MemoryCache;

  beforeEach(() => {
    cache = new MemoryCache();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // -----------------------------------------------------------------------
  // set / get
  // -----------------------------------------------------------------------
  describe('set and get', () => {
    it('stores and retrieves a value', () => {
      cache.set('key1', 'value1', 60);
      expect(cache.get('key1')).toBe('value1');
    });

    it('stores objects', () => {
      const obj = { a: 1, b: [2, 3] };
      cache.set('obj', obj, 60);
      expect(cache.get('obj')).toEqual(obj);
    });

    it('returns null for missing keys', () => {
      expect(cache.get('nonexistent')).toBeNull();
    });

    it('overwrites existing keys', () => {
      cache.set('k', 'v1', 60);
      cache.set('k', 'v2', 60);
      expect(cache.get('k')).toBe('v2');
    });
  });

  // -----------------------------------------------------------------------
  // TTL / expiration
  // -----------------------------------------------------------------------
  describe('expiration', () => {
    it('returns value before TTL expires', () => {
      cache.set('key', 'val', 10); // 10 seconds
      vi.advanceTimersByTime(9_000);
      expect(cache.get('key')).toBe('val');
    });

    it('returns null after TTL expires', () => {
      cache.set('key', 'val', 5);
      vi.advanceTimersByTime(6_000);
      expect(cache.get('key')).toBeNull();
    });

    it('removes expired entry from store on access', () => {
      cache.set('key', 'val', 1);
      vi.advanceTimersByTime(2_000);
      cache.get('key'); // triggers removal
      expect(cache.size()).toBe(0);
    });
  });

  // -----------------------------------------------------------------------
  // delete
  // -----------------------------------------------------------------------
  describe('delete', () => {
    it('removes a specific key', () => {
      cache.set('a', 1, 60);
      cache.set('b', 2, 60);
      cache.delete('a');
      expect(cache.get('a')).toBeNull();
      expect(cache.get('b')).toBe(2);
    });

    it('no-ops on missing key', () => {
      expect(() => cache.delete('ghost')).not.toThrow();
    });
  });

  // -----------------------------------------------------------------------
  // clear
  // -----------------------------------------------------------------------
  describe('clear', () => {
    it('removes all entries', () => {
      cache.set('a', 1, 60);
      cache.set('b', 2, 60);
      cache.clear();
      expect(cache.size()).toBe(0);
      expect(cache.get('a')).toBeNull();
    });

    it('resets hit/miss stats', () => {
      cache.set('a', 1, 60);
      cache.get('a'); // hit
      cache.get('z'); // miss
      cache.clear();
      const stats = cache.getStats();
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
    });
  });

  // -----------------------------------------------------------------------
  // size
  // -----------------------------------------------------------------------
  describe('size', () => {
    it('returns 0 for empty cache', () => {
      expect(cache.size()).toBe(0);
    });

    it('tracks number of entries', () => {
      cache.set('a', 1, 60);
      cache.set('b', 2, 60);
      expect(cache.size()).toBe(2);
    });
  });

  // -----------------------------------------------------------------------
  // getStats
  // -----------------------------------------------------------------------
  describe('getStats', () => {
    it('tracks hits and misses', () => {
      cache.set('a', 1, 60);
      cache.get('a'); // hit
      cache.get('a'); // hit
      cache.get('z'); // miss
      const stats = cache.getStats();
      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(1);
      expect(stats.hitRate).toBeCloseTo(2 / 3);
    });

    it('returns 0 hitRate when no accesses', () => {
      expect(cache.getStats().hitRate).toBe(0);
    });
  });
});

// ---------------------------------------------------------------------------
// withCache helper
// ---------------------------------------------------------------------------
describe('withCache', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('calls fn on cache miss and caches the result', async () => {
    const fn = vi.fn().mockResolvedValue('computed');
    // withCache uses the global `cache` singleton — we import fresh each test
    // but the setup.ts mock resets won't affect MemoryCache. We test via the
    // exported withCache which uses the singleton.
    const result = await withCache('wc-key', 60, fn);
    expect(result).toBe('computed');
    expect(fn).toHaveBeenCalledTimes(1);

    // second call should use cache
    const result2 = await withCache('wc-key', 60, fn);
    expect(result2).toBe('computed');
    expect(fn).toHaveBeenCalledTimes(1); // not called again
  });

  it('recomputes after TTL expires', async () => {
    let counter = 0;
    const fn = vi.fn().mockImplementation(async () => ++counter);

    await withCache('counter', 5, fn);
    expect(fn).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(6_000);

    await withCache('counter', 5, fn);
    expect(fn).toHaveBeenCalledTimes(2);
  });
});
