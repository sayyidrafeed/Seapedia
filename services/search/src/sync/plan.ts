import type { OutboxEvent } from '@seapedia/platform/outbox';
import type { ProductDocument } from '@/elastic/documents';

export type SyncPlan = {
  upserts: ProductDocument[];
  deletes: string[];
};

/** Which documents to fetch from catalog for a batch of events. */
export function idsToFetch(events: OutboxEvent[]) {
  const productIds = new Set<string>();
  const storeIds = new Set<string>();
  for (const event of events) {
    if (event.topic === 'product') productIds.add(event.entityId);
    if (event.topic === 'store') storeIds.add(event.entityId);
  }
  return { productIds: [...productIds], storeIds: [...storeIds] };
}

/**
 * Turns a batch of thin events plus catalog's current documents into index changes.
 * - A product event whose product catalog no longer returns means it was deleted.
 * - A store event re-indexes every product catalog returned for that store (name/slug changes).
 * - Repeated events for the same product collapse into one write.
 */
export function planSync(events: OutboxEvent[], documents: ProductDocument[]): SyncPlan {
  const { productIds } = idsToFetch(events);
  const upserts = new Map(documents.map((doc) => [doc.id, doc]));
  const deletes = productIds.filter((id) => !upserts.has(id));
  return { upserts: [...upserts.values()], deletes };
}
