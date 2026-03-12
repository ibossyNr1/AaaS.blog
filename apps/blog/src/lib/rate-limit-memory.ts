/**
 * Simple in-memory rate limiter for API routes.
 * Uses a sliding window counter per IP/key.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Cleanup stale entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (entry.resetAt < now) store.delete(key);
    }
  }, 5 * 60 * 1000);
}

export interface RateLimitConfig {
  /** Max requests per window */
  limit: number;
  /** Window duration in seconds */
  windowSeconds: number;
}

export const RATE_LIMITS = {
  api: { limit: 100, windowSeconds: 60 } as RateLimitConfig,
  search: { limit: 30, windowSeconds: 60 } as RateLimitConfig,
  ai: { limit: 10, windowSeconds: 60 } as RateLimitConfig,
  webhooks: { limit: 50, windowSeconds: 60 } as RateLimitConfig,
  auth: { limit: 20, windowSeconds: 60 } as RateLimitConfig,
};

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  limit: number;
}

export function checkRateLimit(
  key: string,
  config: RateLimitConfig = RATE_LIMITS.api
): RateLimitResult {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    const resetAt = now + config.windowSeconds * 1000;
    store.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: config.limit - 1, resetAt, limit: config.limit };
  }

  entry.count++;
  store.set(key, entry);

  const allowed = entry.count <= config.limit;
  const remaining = Math.max(0, config.limit - entry.count);

  return { allowed, remaining, resetAt: entry.resetAt, limit: config.limit };
}

export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)),
  };
}

export function resetRateLimit(key: string): void {
  store.delete(key);
}
