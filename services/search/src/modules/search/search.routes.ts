import { factory } from '@seapedia/platform/factory';
import { describeRoute, validator } from 'hono-openapi';
import { z } from 'zod';
import { reindex } from '@/sync/reindex';
import { SearchService } from './search.service';

/** Internal only: catalog queries ranked ids, operators trigger reindexes. */
export const searchRouter = factory.createApp();

searchRouter.get(
  '/products',
  describeRoute({ hide: true }),
  validator(
    'query',
    z.object({
      q: z.string().trim().min(1),
      storeSlug: z.string().optional(),
      page: z.coerce.number().int().min(1).default(1),
      limit: z.coerce.number().int().min(1).max(100).default(20),
    }),
  ),
  async (c) => c.json(await SearchService.searchProducts(c.req.valid('query'))),
);

searchRouter.post('/reindex', describeRoute({ hide: true }), async (c) => c.json(await reindex()));
