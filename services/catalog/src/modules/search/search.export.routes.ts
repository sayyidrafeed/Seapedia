import { requireServiceScope } from '@seapedia/platform/auth';
import { factory } from '@seapedia/platform/factory';
import { describeRoute, validator } from 'hono-openapi';
import { z } from 'zod';
import { ProductsRepo } from '@/modules/products/products.repo';
import { runtime } from '@/runtime';

// Full export of the search projection, for the search service's reindex (scope `catalog:export`).
export const searchExportRouter = factory.createApp();

searchExportRouter.get(
  '/documents/export',
  describeRoute({ hide: true }),
  requireServiceScope(runtime.verifier, 'catalog', 'catalog:export'),
  validator(
    'query',
    z.object({
      after: z.string().uuid().optional(),
      limit: z.coerce.number().int().min(1).max(1000).default(500),
    }),
  ),
  async (c) => {
    const { after, limit } = c.req.valid('query');
    return c.json(await ProductsRepo.exportPage(after, limit));
  },
);
