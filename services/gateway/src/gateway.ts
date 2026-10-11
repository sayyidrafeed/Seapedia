import { Scalar } from '@scalar/hono-api-reference';
import { Hono } from 'hono';
import { getCookie } from 'hono/cookie';
import { cors } from 'hono/cors';
import { proxy } from 'hono/proxy';
import { requestId, type RequestIdVariables } from 'hono/request-id';
import { IDENTITY_HEADERS } from '@seapedia/platform/internal-auth';
import { mergeSpecs, specSchema } from './openapi';
import { routeFor, type ServiceName } from './routes';
import type { Identity, SessionResolver } from './session';

export type GatewayConfig = {
  upstreams: Record<ServiceName, string>;
  internalToken: string;
  sessions: SessionResolver;
  allowedOrigins: string[];
  publicUrl: string;
  timeoutMs: number;
  /** Injected so the composition root (and tests) decide how upstreams are reached. */
  fetch?: (input: Request | URL | string, init?: RequestInit) => Promise<Response>;
};

/** Headers a client must never be able to set: they carry identity and service trust. */
const TRUSTED_HEADERS = [...Object.values(IDENTITY_HEADERS), 'authorization'];

/**
 * The single public entry point. It authenticates (resolves the session cookie with identity),
 * routes by path prefix, and forwards identity to the owning service. Authorization (roles,
 * ownership) stays in each service.
 */
export function createGateway(config: GatewayConfig) {
  const app = new Hono<{ Variables: RequestIdVariables }>();
  const doFetch = config.fetch ?? ((input, init) => fetch(input, init));

  app.onError((err, c) => {
    console.error(
      JSON.stringify({ service: 'gateway', requestId: c.get('requestId'), error: String(err) }),
    );
    return c.json({ error: 'Internal Server Error' }, 500);
  });

  app.use('*', requestId());
  app.use(
    '*',
    cors({
      origin: (origin) => (config.allowedOrigins.includes(origin) ? origin : null),
      credentials: true,
    }),
  );

  // Liveness of the gateway process itself; /api/health reports the upstreams.
  app.get('/healthz', (c) => c.json({ status: 'ok' }));

  app.get('/', (c) =>
    c.json({
      name: 'Seapedia API Gateway',
      docs: '/docs',
      spec: '/openapi.json',
      health: '/api/health',
    }),
  );

  app.get('/api/health', async (c) => {
    const checks = await Promise.all(
      Object.entries(config.upstreams).map(async ([service, url]) => {
        try {
          const res = await doFetch(new URL('/health', url), { signal: AbortSignal.timeout(2000) });
          return [service, res.ok ? 'ok' : `status ${res.status}`] as const;
        } catch {
          return [service, 'unreachable'] as const;
        }
      }),
    );
    const healthy = checks.every(([, status]) => status === 'ok');
    return c.json(
      { status: healthy ? 'ok' : 'degraded', services: Object.fromEntries(checks) },
      healthy ? 200 : 503,
    );
  });

  app.get('/openapi.json', async (c) => {
    const entries = await Promise.all(
      Object.entries(config.upstreams).map(async ([service, url]) => {
        const res = await doFetch(new URL('/openapi.json', url), {
          headers: { authorization: `Bearer ${config.internalToken}` },
          signal: AbortSignal.timeout(5000),
        });
        if (!res.ok) throw new Error(`${service} /openapi.json -> ${res.status}`);
        return [service, specSchema.parse(await res.json())] as const;
      }),
    );
    return c.json(mergeSpecs(Object.fromEntries(entries), config.publicUrl));
  });

  app.get('/docs', Scalar({ pageTitle: 'Seapedia API Docs', url: '/openapi.json' }));

  app.all('/api/*', async (c) => {
    const service = routeFor(c.req.path);
    if (!service) return c.json({ error: 'Not Found' }, 404);

    const headers: Record<string, string | undefined> = { ...c.req.header() };
    for (const name of TRUSTED_HEADERS) headers[name] = undefined;

    const token = getCookie(c, '__session');
    let identity: Identity | null = null;
    if (token) {
      try {
        identity = await config.sessions.resolve(token);
      } catch (error) {
        console.error(
          JSON.stringify({
            service: 'gateway',
            upstream: 'identity',
            requestId: c.get('requestId'),
            error: String(error),
          }),
        );
        return c.json({ error: 'Authentication service unavailable' }, 503);
      }
    }
    if (identity) {
      headers[IDENTITY_HEADERS.userId] = identity.userId;
      headers[IDENTITY_HEADERS.sessionId] = identity.sessionId;
      headers[IDENTITY_HEADERS.activeRole] = identity.activeRole;
    }
    headers.authorization = `Bearer ${config.internalToken}`;
    headers['x-request-id'] = c.get('requestId');
    headers['x-forwarded-host'] = c.req.header('host');

    const target = new URL(c.req.path, config.upstreams[service]);
    target.search = new URL(c.req.url).search;

    let res: Response;
    try {
      res = await proxy(target, {
        raw: c.req.raw,
        headers,
        signal: AbortSignal.timeout(config.timeoutMs),
        customFetch: (req) => doFetch(req),
      });
    } catch (error) {
      const timedOut = error instanceof DOMException && error.name === 'TimeoutError';
      console.error(
        JSON.stringify({
          service: 'gateway',
          upstream: service,
          requestId: c.get('requestId'),
          error: String(error),
        }),
      );
      return c.json(
        { error: timedOut ? 'Upstream timed out' : 'Upstream unavailable' },
        timedOut ? 504 : 502,
      );
    }

    // Identity just changed this session (login, logout, role switch, onboarding): drop the cached view.
    if (token && service === 'identity' && c.req.method !== 'GET') config.sessions.forget(token);
    return res;
  });

  return app;
}
