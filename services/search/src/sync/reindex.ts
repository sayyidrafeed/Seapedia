import { ConflictError } from '@seapedia/platform/errors';
import { createInternalClient } from '@seapedia/platform/internal-client';
import { z } from 'zod';
import { elastic } from '@/elastic/client';
import { productDocumentSchema } from '@/elastic/documents';
import {
  alias,
  acquireRebuildLock,
  aliasExists,
  createIndex,
  dropBuildingIndex,
  ensureStoresIndex,
  releaseRebuildLock,
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

// Runs under this instance's writer lock and the cluster-wide rebuild lock; events consumed
// meanwhile by any instance are written to both the live and the new index, guarded by version.
export function reindex() {
  return exclusive(async () => {
    if (!(await acquireRebuildLock())) throw new ConflictError('A reindex is already running');
    try {
      return await rebuild();
    } catch (error) {
      await dropBuildingIndex();
      throw error;
    } finally {
      await releaseRebuildLock();
    }
  });
}

async function rebuild() {
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
      const result = await elastic.bulk({
        operations: page.documents.flatMap(({ storeVersion, ...doc }) => [
          { index: { _index: index, _id: doc.id } },
          { ...doc, deleted: false },
          { index: { _index: storesIndex, _id: doc.storeId } },
          { name: doc.storeName, slug: doc.storeSlug, version: storeVersion },
        ]),
      });
      // A 200 can still carry rejected items; swapping in a partial index would lose documents.
      if (result.errors) {
        const failed = result.items.find((item) => item.index?.error)?.index?.error;
        throw new Error(`reindex bulk write failed: ${failed?.type}: ${failed?.reason}`);
      }
    }
    count += page.documents.length;
    after = page.next ?? undefined;
  } while (after);

  await elastic.indices.refresh({ index });
  await swapAlias(index);
  console.log(JSON.stringify({ event: 'reindexed', alias, index, documents: count }));
  return { index, documents: count };
}

let markReady = () => {};
// Resolves once the index exists; event handlers wait on it instead of writing to a missing alias.
export const indexReady = new Promise<void>((resolve) => {
  markReady = resolve;
});

// First boot (or a wiped cluster): build the index before applying events.
export async function ensureIndex() {
  await ensureStoresIndex();
  if (!(await aliasExists())) await reindex();
  markReady();
}
