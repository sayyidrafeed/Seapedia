import { alias, aliasExists, createIndex, swapAlias } from '@/elastic/indices';
import { elastic } from '@/elastic/client';
import { fetchExportPage } from './catalog';
import { exclusive } from './lock';
import { writePlan } from './write';

const PAGE_SIZE = 500;

/**
 * Builds a fresh index from catalog's full export and atomically points the alias at it.
 * Runs under the writer lock: outbox events that arrive meanwhile stay pending and are applied to
 * the new index right after the swap.
 */
export function reindex() {
  return exclusive(async () => {
    const index = await createIndex();
    let after: string | undefined;
    let count = 0;
    do {
      const page = await fetchExportPage(after, PAGE_SIZE);
      await writePlan(index, { upserts: page.documents, deletes: [] });
      count += page.documents.length;
      after = page.next ?? undefined;
    } while (after);

    await elastic.indices.refresh({ index });
    await swapAlias(index);
    console.log(JSON.stringify({ event: 'reindexed', alias, index, documents: count }));
    return { index, documents: count };
  });
}

/** First boot (or a wiped cluster): build the index before serving or syncing. */
export async function ensureIndex() {
  if (!(await aliasExists())) await reindex();
}
