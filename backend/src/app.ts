import { Scalar } from '@scalar/hono-api-reference';
import { cors } from 'hono/cors';
import { HTTPException } from 'hono/http-exception';
import { generateSpecs } from 'hono-openapi';
import { hoistDefs } from '@/lib/openapi';
import { DomainError } from '@/lib/errors';
import { factory } from '@/lib/factory';
import { healthRouter } from '@/modules/health/health.index';
import { authRouter } from '@/modules/auth/auth.index';
import { productsRouter, sellerProductsRouter } from '@/modules/products/products.index';
import { reviewsRouter } from '@/modules/reviews/reviews.index';
import { privateRouter } from '@/modules/private/private.index';
import { storesRouter } from '@/modules/stores/stores.index';
import { buyersRouter } from '@/modules/buyers/buyers.index';
import { ordersRouter, sellerOrdersRouter } from '@/modules/orders/orders.index';
import { adminRouter } from '@/modules/admin/admin.index';
import { discountsBuyerRouter } from '@/modules/discounts/discounts.index';
import { driverRouter } from '@/modules/driver/driver.index';
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
app.route('/api/seller/products', sellerProductsRouter);
app.route('/api/reviews', reviewsRouter);
app.route('/api/private', privateRouter);
app.route('/api/stores', storesRouter);
app.route('/api/buyers', buyersRouter);
app.route('/api/orders', ordersRouter);
app.route('/api/seller/orders', sellerOrdersRouter);
app.route('/api/admin', adminRouter);
app.route('/api/discounts', discountsBuyerRouter);
app.route('/api/driver', driverRouter);

app.get('/openapi.json', async (c) => {
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
  const updatedSpec = hoistDefs(spec) as Record<string, unknown>;

  return c.json(updatedSpec);
});

app.get(
  '/docs',
  Scalar({
    pageTitle: 'Seapedia API Docs',
    url: '/openapi.json',
  }),
);

export type AppType = typeof app;
