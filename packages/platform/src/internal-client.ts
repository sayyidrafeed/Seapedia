import type { z } from 'zod';
import { currentRequestId } from './request-context';

export class UpstreamError extends Error {
  constructor(
    readonly service: string,
    readonly status: number | undefined,
    message: string,
  ) {
    super(`[${service}] ${message}`);
    this.name = 'UpstreamError';
  }
}

type Query = Record<string, string | number | boolean | string[] | undefined>;

export type InternalClientConfig = {
  /** Upstream name, used in errors and logs. */
  service: string;
  baseUrl: string;
  token: string;
  timeoutMs?: number;
};

/**
 * Typed HTTP client for service-to-service calls: bearer token, timeout, request-id propagation,
 * and response validation at the boundary.
 */
export function createInternalClient({
  service,
  baseUrl,
  token,
  timeoutMs = 2000,
}: InternalClientConfig) {
  async function request<T>(
    method: 'GET' | 'POST',
    path: string,
    schema: z.ZodType<T>,
    options: { query?: Query; body?: unknown; timeoutMs?: number } = {},
  ): Promise<T> {
    const url = new URL(path, baseUrl);
    for (const [key, value] of Object.entries(options.query ?? {})) {
      if (value === undefined) continue;
      url.searchParams.set(key, Array.isArray(value) ? value.join(',') : String(value));
    }

    const headers: Record<string, string> = { authorization: `Bearer ${token}` };
    const requestId = currentRequestId();
    if (requestId) headers['x-request-id'] = requestId;
    if (options.body !== undefined) headers['content-type'] = 'application/json';

    let response: Response;
    try {
      response = await fetch(url, {
        method,
        headers,
        signal: AbortSignal.timeout(options.timeoutMs ?? timeoutMs),
        ...(options.body === undefined ? {} : { body: JSON.stringify(options.body) }),
      });
    } catch (error) {
      throw new UpstreamError(service, undefined, `${method} ${path} failed: ${String(error)}`);
    }

    if (!response.ok) {
      throw new UpstreamError(service, response.status, `${method} ${path} -> ${response.status}`);
    }

    const parsed = schema.safeParse(await response.json());
    if (!parsed.success) {
      throw new UpstreamError(
        service,
        response.status,
        `${method} ${path} returned an invalid body`,
      );
    }
    return parsed.data;
  }

  return {
    get: <T>(path: string, schema: z.ZodType<T>, query?: Query, opts?: { timeoutMs?: number }) =>
      request('GET', path, schema, { query, ...opts }),
    post: <T>(path: string, schema: z.ZodType<T>, body?: unknown, opts?: { timeoutMs?: number }) =>
      request('POST', path, schema, { body, ...opts }),
  };
}

export type InternalClient = ReturnType<typeof createInternalClient>;
