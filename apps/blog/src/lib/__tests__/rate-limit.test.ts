import { describe, it, expect, beforeEach } from 'vitest';
import { checkRateLimit, resetRateLimit, getRateLimitHeaders } from '../rate-limit';

describe('Rate Limiter', () => {
  beforeEach(() => {
    resetRateLimit('test-key');
  });

  it('allows requests within limit', () => {
    const result = checkRateLimit('test-key', { limit: 5, windowSeconds: 60 });
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it('blocks requests over limit', () => {
    const config = { limit: 3, windowSeconds: 60 };
    checkRateLimit('test-key', config);
    checkRateLimit('test-key', config);
    checkRateLimit('test-key', config);
    const result = checkRateLimit('test-key', config);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('tracks different keys independently', () => {
    const config = { limit: 1, windowSeconds: 60 };
    checkRateLimit('key-a', config);
    const result = checkRateLimit('key-b', config);
    expect(result.allowed).toBe(true);
  });

  it('returns correct rate limit headers', () => {
    const result = checkRateLimit('test-key', { limit: 100, windowSeconds: 60 });
    const headers = getRateLimitHeaders(result);
    expect(headers['X-RateLimit-Limit']).toBe('100');
    expect(headers['X-RateLimit-Remaining']).toBe('99');
    expect(headers['X-RateLimit-Reset']).toBeDefined();
  });

  it('resets rate limit for key', () => {
    const config = { limit: 1, windowSeconds: 60 };
    checkRateLimit('test-key', config);
    resetRateLimit('test-key');
    const result = checkRateLimit('test-key', config);
    expect(result.allowed).toBe(true);
  });
});
