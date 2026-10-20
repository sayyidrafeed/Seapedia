import { createInternalClient } from '@seapedia/platform/internal-client';
import { z } from 'zod';
import { elastic } from '@/elastic/client';
import { productDocumentSchema } from '@/elastic/documents';
import {
  alias,
  aliasExists,
  createIndex,
  ensureStoresIndex,
  storesIndex,
  swapAlias,
} from '@/elastic/indices';
import { runtime } from '@/runtime';
import { exclusive } from './lock';

const PAGE_SIZE = 500;
const exportPage = z.object({
  documents: z.array(
    productDocumentSchema.extend({ version: z.number().int(), storeVersion: z.number().int() }),
  ),
  next: z.string().nullable(),
});

const catalog = createInternalClient({
  service: 'catalog',
  resolver: runtime.resolver,
  tokens: runtime.tokens,
  scope: 'catalog:export',
  timeoutMs: 10_000,
});

/**
 * Builds a fresh index from catalog's full export (ops path, scope `catalog:export`) and swaps the
 * alias atomically. Runs under the writer lock, so events consumed meanwhile wait and then apply
 * to the new index; their version guard keeps whichever state is newer.
 */
export function reindex() {
  return exclusive(async () => {
    await ensureStoresIndex();
    const index = await createIndex();
    let after: string | undefined;
    let count = 0;
    do {
      const page = await catalog.get('/internal/search/documents/export', exportPage, {
        after,
        limit: PAGE_SIZE,
      });
      if (page.documents.length > 0) {
        await elastic.bulk({
          operations: page.documents.flatMap(({ storeVersion, ...doc }) => [
            { index: { _index: index, _id: doc.id } },
            { ...doc, deleted: false },
            { index: { _index: storesIndex, _id: doc.storeId } },
            { name: doc.storeName, slug: doc.storeSlug, version: storeVersion },
          ]),
        });
      }
      count += page.documents.length;
      after = page.next ?? undefined;
    } while (after);

    await elastic.indices.refresh({ index });
    await swapAlias(index);
    console.log(JSON.stringify({ event: 'reindexed', alias, index, documents: count }));
    return { index, documents: count };
  });
}

/** First boot (or a wiped cluster): build the index before syncing. */
export async function ensureIndex() {
  await ensureStoresIndex();
  if (!(await aliasExists())) await reindex();
}
