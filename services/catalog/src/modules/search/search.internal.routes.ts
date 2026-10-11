import { factory } from '@seapedia/platform/factory';
import { describeRoute, validator } from 'hono-openapi';
import { z } from 'zod';
import { SearchDocuments } from './search.documents';

const csv = z
  .string()
  .optional()
  .transform((v) => (v ? v.split(',').filter(Boolean) : []));

/** Internal: the search service pulls its projection from here. */
export const searchInternalRouter = factory.createApp();

searchInternalRouter.get(
  '/documents',
  describeRoute({ hide: true }),
  validator('query', z.object({ productIds: csv, storeIds: csv })),
  async (c) => {
    const { productIds, storeIds } = c.req.valid('query');
    return c.json({ documents: await SearchDocuments.byIds(productIds, storeIds) });
  },
);

searchInternalRouter.get(
  '/documents/export',
  describeRoute({ hide: true }),
  validator(
    'query',
    z.object({
      after: z.string().uuid().optional(),
      limit: z.coerce.number().int().min(1).max(1000).default(500),
    }),
  ),
  async (c) => {
    const { after, limit } = c.req.valid('query');
    return c.json(await SearchDocuments.exportPage(after, limit));
  },
);
