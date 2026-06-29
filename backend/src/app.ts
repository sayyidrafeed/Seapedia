import { Scalar } from '@scalar/hono-api-reference';
import { cors } from 'hono/cors';
import { HTTPException } from 'hono/http-exception';
import { generateSpecs } from 'hono-openapi';
import { hoistDefs } from '@/lib/openapi';
import { DomainError } from '@/lib/errors';
import { factory } from '@/lib/factory';
import { healthRouter } from '@/modules/health/health.index';
import { authRouter } from '@/modules/auth/auth.index';
import { productsRouter } from '@/modules/products/products.index';
import { reviewsRouter } from '@/modules/reviews/reviews.index';
import { privateRouter } from '@/modules/private/private.index';
import { frontendUrls } from '@/env';

export const app = factory.createApp();

app.onError((err, c) => {
  if (err instanceof DomainError) {
    return c.json({ error: err.userMessage }, err.statusCode);
  }

  if (err instanceof HTTPException) {
    return err.getResponse();
  }

  console.error(err);
  return c.json({ error: 'Internal Server Error' }, 500);
});

app.use(
  '*',
  cors({
    origin: (origin) => {
      if (origin && frontendUrls.includes(origin)) return origin;
      return frontendUrls[0];
    },
    credentials: true,
  }),
);

app.route('/api/health', healthRouter);
app.route('/api/auth', authRouter);
app.route('/api/products', productsRouter);
app.route('/api/reviews', reviewsRouter);
app.route('/api/private', privateRouter);

let openApiCache: Record<string, unknown> | null = null;

app.get('/openapi.json', async (c) => {
  if (!openApiCache) {
    const spec = await generateSpecs(app, {
      documentation: {
        openapi: '3.0.0',
        info: {
          title: 'Seapedia API',
          version: '1.0.0',
          description: 'Seapedia REST API',
        },
        servers: [{ url: 'http://localhost:3001' }],
        components: {
          securitySchemes: {
            cookieAuth: {
              type: 'apiKey',
              in: 'cookie',
              name: '__session',
            },
          },
        },
      },
      excludeMethods: ['OPTIONS', 'HEAD'],
    });
    openApiCache = hoistDefs(spec) as Record<string, unknown>;
  }

  return c.json(openApiCache);
});

app.get(
  '/docs',
  Scalar({
    pageTitle: 'Seapedia API Docs',
    url: '/openapi.json',
  }),
);

export type AppType = typeof app;
