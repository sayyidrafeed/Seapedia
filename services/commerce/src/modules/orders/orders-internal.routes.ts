import { factory } from '@seapedia/platform/factory';
import { describeRoute, validator } from 'hono-openapi';
import { z } from 'zod';
import { OrdersInternalService } from './orders-internal.service';

export const ordersInternalRouter = factory.createApp();

ordersInternalRouter.get(
  '/purchases/check',
  describeRoute({ hide: true }),
  validator('query', z.object({ buyerId: z.string().uuid(), productId: z.string().uuid() })),
  async (c) => {
    const { buyerId, productId } = c.req.valid('query');
    return c.json({
      purchased: await OrdersInternalService.hasCompletedPurchase(buyerId, productId),
    });
  },
);

ordersInternalRouter.get(
  '/sales',
  describeRoute({ hide: true }),
  validator(
    'query',
    z.object({ productIds: z.string().transform((v) => v.split(',').filter(Boolean)) }),
  ),
  async (c) => {
    const { productIds } = c.req.valid('query');
    return c.json({ items: await OrdersInternalService.soldCounts(productIds) });
  },
);
