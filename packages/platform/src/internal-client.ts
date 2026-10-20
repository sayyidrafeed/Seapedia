import type { z } from 'zod';
import type { ServiceTokenProvider } from './auth/service-tokens';
import type { Resolver } from './consul/discovery';
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
  /** Callee service name, as registered in Consul and used as the token audience. */
  service: string;
  resolver: Resolver;
  /** Client-credentials token for this callee, carrying `scope`. */
  tokens: ServiceTokenProvider;
  scope: string;
  timeoutMs?: number;
};

/**
 * Typed service-to-service HTTP client: client-side discovery (healthy instances, round-robin,
 * next instance on connection failure), a scoped service token, timeout, request-id
 * propagation, and response validation at the boundary.
 */
export function createInternalClient({
  service,
  resolver,
  tokens,
  scope,
  timeoutMs = 2000,
}: InternalClientConfig) {
  async function request<T>(
    method: 'GET' | 'POST',
    path: string,
    schema: z.ZodType<T>,
    options: { query?: Query; body?: unknown; timeoutMs?: number } = {},
  ): Promise<T> {
    const headers: Record<string, string> = {
      authorization: `Bearer ${await tokens(service, scope)}`,
    };
    const requestId = currentRequestId();
    if (requestId) headers['x-request-id'] = requestId;
    if (options.body !== undefined) headers['content-type'] = 'application/json';

    const tries = Math.max(1, await resolver.count(service).catch(() => 1));
    let lastError: unknown;
    for (let attempt = 0; attempt < tries; attempt++) {
      const url = new URL(path, await resolver.resolve(service));
      for (const [key, value] of Object.entries(options.query ?? {})) {
        if (value === undefined) continue;
        url.searchParams.set(key, Array.isArray(value) ? value.join(',') : String(value));
      }

      let response: Response;
      try {
        response = await fetch(url, {
          method,
          headers,
          signal: AbortSignal.timeout(options.timeoutMs ?? timeoutMs),
          ...(options.body === undefined ? {} : { body: JSON.stringify(options.body) }),
        });
      } catch (error) {
        // Connection-level failure: this instance may be gone; try the next one.
        lastError = error;
        resolver.invalidate(service);
        continue;
      }

      if (!response.ok) {
        throw new UpstreamError(
          service,
          response.status,
          `${method} ${path} -> ${response.status}`,
        );
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
    throw new UpstreamError(service, undefined, `${method} ${path} failed: ${String(lastError)}`);
  }

  return {
    get: <T>(path: string, schema: z.ZodType<T>, query?: Query, opts?: { timeoutMs?: number }) =>
      request('GET', path, schema, { query, ...opts }),
    post: <T>(path: string, schema: z.ZodType<T>, body?: unknown, opts?: { timeoutMs?: number }) =>
      request('POST', path, schema, { body, ...opts }),
  };
}

export type InternalClient = ReturnType<typeof createInternalClient>;
