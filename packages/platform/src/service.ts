import type { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { requestId } from 'hono/request-id';
import { generateSpecs } from 'hono-openapi';
import type { SessionDenylist } from './auth/denylist';
import { authenticate } from './auth/middleware';
import type { TokenVerifier } from './auth/tokens';
import { DomainError } from './errors';
import { factory, type ServiceEnv } from './factory';
import { UpstreamError } from './internal-client';
import { hoistDefs } from './openapi';
import { requestContext } from './request-context';

export type ServiceAppOptions = {
  name: string;
  verifier: TokenVerifier;
  denylist: SessionDenylist;
};

// Authentication here; authorization per route (requireSession/requireRole, requireServiceScope).
export function createServiceApp({ name, verifier, denylist }: ServiceAppOptions) {
  const app = factory.createApp();

  app.onError((err, c) => {
    if (err instanceof DomainError) {
      return c.json({ error: err.userMessage }, err.statusCode);
    }
    if (err instanceof HTTPException) {
      return err.getResponse();
    }
    const log = { service: name, requestId: c.get('requestId'), error: String(err) };
    if (err instanceof UpstreamError) {
      console.error(JSON.stringify(log));
      return c.json({ error: 'A dependent service is unavailable' }, 503);
    }
    console.error(JSON.stringify({ ...log, stack: err.stack }));
    return c.json({ error: 'Internal Server Error' }, 500);
  });

  app.use('*', requestId(), requestContext);
  app.get('/health', (c) => c.json({ status: 'ok', service: name }));
  app.use('*', authenticate(verifier, denylist));

  return app;
}

// Serves this service's public OpenAPI document (merged into the public contract by scripts/openapi.ts).
export function serviceSpec(app: Hono<ServiceEnv>, title: string) {
  return async () => {
    const spec = await generateSpecs(app, {
      documentation: {
        openapi: '3.0.0',
        info: { title, version: '1.0.0' },
        components: {
          securitySchemes: {
            cookieAuth: { type: 'apiKey', in: 'cookie', name: '__access' },
          },
        },
      },
      excludeMethods: ['OPTIONS', 'HEAD'],
    });
    return hoistDefs(spec) as Record<string, unknown>;
  };
}
