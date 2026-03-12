import { NextRequest } from 'next/server';

export function createMockRequest(
  url: string,
  options?: {
    method?: string;
    headers?: Record<string, string>;
    body?: unknown;
    searchParams?: Record<string, string>;
  }
): NextRequest {
  const fullUrl = new URL(url, 'http://localhost:3000');
  if (options?.searchParams) {
    for (const [k, v] of Object.entries(options.searchParams)) {
      fullUrl.searchParams.set(k, v);
    }
  }

  const headers = new Headers(options?.headers ?? {});

  if (options?.body) {
    headers.set('Content-Type', 'application/json');
  }

  const init = {
    method: options?.method ?? 'GET',
    headers,
    body: options?.body ? JSON.stringify(options.body) : undefined,
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new NextRequest(fullUrl, init as any);
}

export async function parseJsonResponse(response: Response) {
  const json = await response.json();
  return { status: response.status, json };
}
