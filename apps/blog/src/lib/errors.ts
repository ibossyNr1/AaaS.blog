import { NextRequest, NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AppError {
  code: string;
  message: string;
  statusCode: number;
  details?: unknown;
}

// ---------------------------------------------------------------------------
// ApiError class
// ---------------------------------------------------------------------------

export class ApiError extends Error {
  readonly code: string;
  readonly statusCode: number;
  readonly details?: unknown;

  constructor({ code, message, statusCode, details }: AppError) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

// ---------------------------------------------------------------------------
// Predefined errors
// ---------------------------------------------------------------------------

export const ERRORS = {
  NOT_FOUND: { code: "NOT_FOUND", message: "Resource not found", statusCode: 404 },
  UNAUTHORIZED: { code: "UNAUTHORIZED", message: "Authentication required", statusCode: 401 },
  FORBIDDEN: { code: "FORBIDDEN", message: "Insufficient permissions", statusCode: 403 },
  RATE_LIMITED: { code: "RATE_LIMITED", message: "Too many requests", statusCode: 429 },
  VALIDATION: { code: "VALIDATION", message: "Invalid request data", statusCode: 400 },
  INTERNAL: { code: "INTERNAL", message: "Internal server error", statusCode: 500 },
} as const satisfies Record<string, AppError>;

// ---------------------------------------------------------------------------
// handleApiError — converts any error to an appropriate API response
// ---------------------------------------------------------------------------

export function handleApiError(error: unknown): NextResponse {
  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        error: {
          code: error.code,
          message: error.message,
          ...(error.details !== undefined && { details: error.details }),
        },
      },
      { status: error.statusCode },
    );
  }

  if (error instanceof Error) {
    console.error("[handleApiError]", error.message, error.stack);
  } else {
    console.error("[handleApiError]", error);
  }

  return NextResponse.json(
    { error: { code: "INTERNAL", message: "Internal server error" } },
    { status: 500 },
  );
}

// ---------------------------------------------------------------------------
// withErrorHandler — wraps a route handler with automatic error catching
// ---------------------------------------------------------------------------

export function withErrorHandler(
  handler: (req: NextRequest) => Promise<NextResponse>,
): (req: NextRequest) => Promise<NextResponse> {
  return async (req: NextRequest) => {
    try {
      return await handler(req);
    } catch (error) {
      return handleApiError(error);
    }
  };
}

// ---------------------------------------------------------------------------
// retry — exponential backoff retry
// ---------------------------------------------------------------------------

export async function retry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 500,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === maxRetries) break;

      const backoff = delayMs * Math.pow(2, attempt);
      const jitter = Math.random() * backoff * 0.1;
      await new Promise((resolve) => setTimeout(resolve, backoff + jitter));
    }
  }

  throw lastError;
}

// ---------------------------------------------------------------------------
// circuitBreaker — prevents cascading failures
// ---------------------------------------------------------------------------

type CircuitState = "closed" | "open" | "half-open";

export function circuitBreaker<T>(
  fn: () => Promise<T>,
  opts: { threshold: number; resetMs: number },
): () => Promise<T> {
  let state: CircuitState = "closed";
  let failures = 0;
  let lastFailureTime = 0;

  return async () => {
    if (state === "open") {
      const elapsed = Date.now() - lastFailureTime;
      if (elapsed < opts.resetMs) {
        throw new ApiError({
          code: "CIRCUIT_OPEN",
          message: "Service temporarily unavailable. Please try again later.",
          statusCode: 503,
        });
      }
      // Transition to half-open — allow a single test request
      state = "half-open";
    }

    try {
      const result = await fn();
      // Success — reset circuit
      failures = 0;
      state = "closed";
      return result;
    } catch (error) {
      failures++;
      lastFailureTime = Date.now();

      if (failures >= opts.threshold || state === "half-open") {
        state = "open";
      }

      throw error;
    }
  };
}
