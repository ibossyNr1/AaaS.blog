import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ApiError, ERRORS, retry, circuitBreaker } from '@/lib/errors';

describe('errors', () => {
  // -----------------------------------------------------------------------
  // ApiError class
  // -----------------------------------------------------------------------
  describe('ApiError', () => {
    it('extends Error with correct properties', () => {
      const err = new ApiError({
        code: 'TEST',
        message: 'test message',
        statusCode: 418,
        details: { extra: true },
      });
      expect(err).toBeInstanceOf(Error);
      expect(err).toBeInstanceOf(ApiError);
      expect(err.name).toBe('ApiError');
      expect(err.code).toBe('TEST');
      expect(err.message).toBe('test message');
      expect(err.statusCode).toBe(418);
      expect(err.details).toEqual({ extra: true });
    });

    it('works without details', () => {
      const err = new ApiError({
        code: 'NO_DETAILS',
        message: 'no details',
        statusCode: 400,
      });
      expect(err.details).toBeUndefined();
    });

    it('has a readable stack trace', () => {
      const err = new ApiError(ERRORS.NOT_FOUND);
      expect(err.stack).toBeDefined();
    });
  });

  // -----------------------------------------------------------------------
  // Predefined ERRORS
  // -----------------------------------------------------------------------
  describe('ERRORS', () => {
    it('defines standard HTTP error types', () => {
      expect(ERRORS.NOT_FOUND.statusCode).toBe(404);
      expect(ERRORS.UNAUTHORIZED.statusCode).toBe(401);
      expect(ERRORS.FORBIDDEN.statusCode).toBe(403);
      expect(ERRORS.RATE_LIMITED.statusCode).toBe(429);
      expect(ERRORS.VALIDATION.statusCode).toBe(400);
      expect(ERRORS.INTERNAL.statusCode).toBe(500);
    });

    it('each error has code and message', () => {
      for (const err of Object.values(ERRORS)) {
        expect(err.code).toBeTruthy();
        expect(err.message).toBeTruthy();
        expect(typeof err.statusCode).toBe('number');
      }
    });
  });

  // -----------------------------------------------------------------------
  // retry
  // -----------------------------------------------------------------------
  // Use real timers with very short delays for retry tests to avoid
  // unhandled promise rejection warnings with fake timers.
  describe('retry', () => {
    it('returns result on first success', async () => {
      const fn = vi.fn().mockResolvedValue('ok');
      const result = await retry(fn, 3, 1);
      expect(result).toBe('ok');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('retries and succeeds on second attempt', async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error('fail1'))
        .mockResolvedValue('ok');

      const result = await retry(fn, 3, 1);
      expect(result).toBe('ok');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('throws after exhausting all retries', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('always fails'));

      await expect(retry(fn, 2, 1)).rejects.toThrow('always fails');
      expect(fn).toHaveBeenCalledTimes(3); // initial + 2 retries
    });

    it('respects maxRetries=0 (no retries)', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('once'));

      await expect(retry(fn, 0, 1)).rejects.toThrow('once');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('throws the last error, not an earlier one', async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error('err1'))
        .mockRejectedValueOnce(new Error('err2'))
        .mockRejectedValue(new Error('err3'));

      await expect(retry(fn, 2, 1)).rejects.toThrow('err3');
    });
  });

  // -----------------------------------------------------------------------
  // circuitBreaker
  // -----------------------------------------------------------------------
  describe('circuitBreaker', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    it('passes through on success', async () => {
      const fn = vi.fn().mockResolvedValue('data');
      const wrapped = circuitBreaker(fn, { threshold: 3, resetMs: 5000 });
      const result = await wrapped();
      expect(result).toBe('data');
    });

    it('opens circuit after threshold failures', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('fail'));
      const wrapped = circuitBreaker(fn, { threshold: 2, resetMs: 5000 });

      // Two failures to open the circuit
      await expect(wrapped()).rejects.toThrow('fail');
      await expect(wrapped()).rejects.toThrow('fail');

      // Circuit is now open — should throw CIRCUIT_OPEN without calling fn
      fn.mockClear();
      await expect(wrapped()).rejects.toThrow('Service temporarily unavailable');
      expect(fn).not.toHaveBeenCalled();
    });

    it('transitions to half-open after resetMs', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('fail'));
      const wrapped = circuitBreaker(fn, { threshold: 2, resetMs: 1000 });

      await expect(wrapped()).rejects.toThrow('fail');
      await expect(wrapped()).rejects.toThrow('fail');

      // Advance past resetMs
      vi.advanceTimersByTime(1500);

      // Now in half-open: should call fn again
      fn.mockResolvedValue('recovered');
      const result = await wrapped();
      expect(result).toBe('recovered');
    });

    it('reopens circuit if half-open request fails', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('fail'));
      const wrapped = circuitBreaker(fn, { threshold: 2, resetMs: 1000 });

      await expect(wrapped()).rejects.toThrow('fail');
      await expect(wrapped()).rejects.toThrow('fail');

      vi.advanceTimersByTime(1500);

      // Half-open attempt fails
      await expect(wrapped()).rejects.toThrow('fail');

      // Should be open again
      fn.mockClear();
      await expect(wrapped()).rejects.toThrow('Service temporarily unavailable');
      expect(fn).not.toHaveBeenCalled();
    });

    it('resets failure count on success', async () => {
      let callCount = 0;
      const fn = vi.fn().mockImplementation(async () => {
        callCount++;
        if (callCount === 2) throw new Error('hiccup');
        return 'ok';
      });
      const wrapped = circuitBreaker(fn, { threshold: 3, resetMs: 5000 });

      expect(await wrapped()).toBe('ok');       // success (1)
      await expect(wrapped()).rejects.toThrow(); // fail (2)
      expect(await wrapped()).toBe('ok');       // success (3) — resets count

      // One more failure should NOT open circuit (count reset)
      callCount = 1; // next call will be 2 -> fail
      await expect(wrapped()).rejects.toThrow();
      // Still not open (only 1 failure since last success)
      fn.mockResolvedValue('still-ok');
      expect(await wrapped()).toBe('still-ok');
    });
  });
});
