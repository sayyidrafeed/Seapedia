import type { estypes } from '@elastic/elasticsearch';
import { elastic } from '@/elastic/client';
import type { SyncPlan } from './plan';

/** Applies a plan to `index` (an alias or a concrete index). Throws if any write failed. */
export async function writePlan(index: string, plan: SyncPlan) {
  const operations: NonNullable<estypes.BulkRequest['operations']> = [
    ...plan.upserts.flatMap((doc) => [{ index: { _index: index, _id: doc.id } }, doc]),
    ...plan.deletes.map((id) => ({ delete: { _index: index, _id: id } })),
  ];
  if (operations.length === 0) return;

  const result = await elastic.bulk({ operations });
  if (!result.errors) return;

  // Deleting a document that was never indexed is fine; anything else must be retried.
  const failures = result.items.filter((item) => {
    const op = item.index ?? item.delete;
    return op?.error && !(item.delete && op.status === 404);
  });
  if (failures.length > 0) {
    throw new Error(
      `bulk write failed for ${failures.length} item(s): ${JSON.stringify(failures[0])}`,
    );
  }
}
