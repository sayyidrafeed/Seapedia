import { createOutbox } from '@seapedia/platform/outbox';
import { db } from '@/db';
import { outbox } from '@/db/schema';

/**
 * Catalog's published events. Every write that changes a product or store a consumer depends on
 * must call `catalogOutbox.enqueue(tx, ...)` inside the same transaction.
 *
 * - search: rebuilds its product documents (store changes fan out to the store's products)
 * - commerce: refreshes its product_refs / store_refs replicas used by cart and checkout
 */
export const catalogOutbox = createOutbox({
  db,
  table: outbox,
  subscriptions: {
    product: ['search', 'commerce'],
    store: ['search', 'commerce'],
  },
});
