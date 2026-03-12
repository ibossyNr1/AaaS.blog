/**
 * Shared API middleware utilities.
 * Provides rate limiting, CORS, and request validation helpers.
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getRateLimitHeaders, RATE_LIMITS, type RateLimitConfig } from './rate-limit-memory';

export function getClientIP(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  );
}

export function withRateLimit(
  handler: (req: NextRequest, ...args: unknown[]) => Promise<NextResponse>,
  config: RateLimitConfig = RATE_LIMITS.api
) {
  return async (req: NextRequest, ...args: unknown[]): Promise<NextResponse> => {
    const ip = getClientIP(req);
    const result = checkRateLimit(ip, config);
    const headers = getRateLimitHeaders(result);

    if (!result.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429, headers }
      );
    }

    const response = await handler(req, ...args);

    // Add rate limit headers to successful responses
    for (const [key, value] of Object.entries(headers)) {
      response.headers.set(key, value);
    }

    return response;
  };
}

export function corsHeaders(origin?: string): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': origin ?? '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key, x-user-id, x-workspace-id',
    'Access-Control-Max-Age': '86400',
  };
}

export function handleCORS(req: NextRequest): NextResponse | null {
  if (req.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 204,
      headers: corsHeaders(req.headers.get('origin') ?? undefined),
    });
  }
  return null;
}

export function validateRequiredHeaders(
  req: NextRequest,
  ...headers: string[]
): { valid: true } | { valid: false; response: NextResponse } {
  for (const header of headers) {
    if (!req.headers.get(header)) {
      return {
        valid: false,
        response: NextResponse.json(
          { error: `Missing required header: ${header}` },
          { status: 401 }
        ),
      };
    }
  }
  return { valid: true };
}

export function validateJsonBody<T>(
  body: unknown,
  requiredFields: string[]
): { valid: true; data: T } | { valid: false; response: NextResponse } {
  if (!body || typeof body !== 'object') {
    return {
      valid: false,
      response: NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 }),
    };
  }

  for (const field of requiredFields) {
    if (!(field in (body as Record<string, unknown>))) {
      return {
        valid: false,
        response: NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        ),
      };
    }
  }

  return { valid: true, data: body as T };
}
