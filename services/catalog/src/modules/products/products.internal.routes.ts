import { factory } from '@seapedia/platform/factory';
import { describeRoute, validator } from 'hono-openapi';
import { z } from 'zod';
import { ProductsService } from './products.service';

const idsQuery = z.object({
  ids: z.string().transform((v) => v.split(',').filter(Boolean)),
});

/** Internal reads used by commerce to maintain its product/store replicas. */
export const productsInternalRouter = factory.createApp();

productsInternalRouter.get(
  '/products',
  describeRoute({ hide: true }),
  validator('query', idsQuery),
  async (c) => {
    const { ids } = c.req.valid('query');
    return c.json({ products: await ProductsService.getProductRefs(ids) });
  },
);

productsInternalRouter.get('/stats', describeRoute({ hide: true }), async (c) => {
  return c.json(await ProductsService.getStats());
});
