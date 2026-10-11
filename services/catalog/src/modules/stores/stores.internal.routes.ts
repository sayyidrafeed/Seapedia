import { factory } from '@seapedia/platform/factory';
import { describeRoute, validator } from 'hono-openapi';
import { z } from 'zod';
import { StoreService } from './stores.service';

export const storesInternalRouter = factory.createApp();

storesInternalRouter.get(
  '/',
  describeRoute({ hide: true }),
  validator('query', z.object({ ids: z.string().transform((v) => v.split(',').filter(Boolean)) })),
  async (c) => {
    const { ids } = c.req.valid('query');
    return c.json({ stores: await StoreService.getStoreRefs(ids) });
  },
);
