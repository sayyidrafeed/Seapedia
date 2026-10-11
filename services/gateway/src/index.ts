import { createInternalClient } from '@seapedia/platform/internal-client';
import { env } from './env';
import { createGateway } from './gateway';
import { createSessionResolver, introspectionSchema } from './session';

const identity = createInternalClient({
  service: 'identity',
  baseUrl: env.IDENTITY_SERVICE_URL,
  token: env.INTERNAL_API_TOKEN,
});

const sessions = createSessionResolver(
  (token) => identity.post('/internal/sessions/introspect', introspectionSchema, { token }),
  env.SESSION_CACHE_TTL_MS,
);

const app = createGateway({
  upstreams: {
    identity: env.IDENTITY_SERVICE_URL,
    catalog: env.CATALOG_SERVICE_URL,
    commerce: env.COMMERCE_SERVICE_URL,
  },
  internalToken: env.INTERNAL_API_TOKEN,
  sessions,
  allowedOrigins: env.FRONTEND_URL,
  publicUrl: env.PUBLIC_API_URL,
  timeoutMs: env.UPSTREAM_TIMEOUT_MS,
});

console.log(`gateway listening on :${env.PORT}`);

Bun.serve({
  fetch: app.fetch,
  port: env.PORT,
});
