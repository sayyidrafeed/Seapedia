import { factory } from '@seapedia/platform/factory';
import { describeRoute, validator } from 'hono-openapi';
import { z } from 'zod';
import { InventoryService } from './inventory.service';

export const inventoryInternalRouter = factory.createApp();

inventoryInternalRouter.get(
  '/',
  describeRoute({ hide: true }),
  validator(
    'query',
    z.object({ productIds: z.string().transform((v) => v.split(',').filter(Boolean)) }),
  ),
  async (c) => {
    const { productIds } = c.req.valid('query');
    return c.json({ items: await InventoryService.getStock(productIds) });
  },
);
