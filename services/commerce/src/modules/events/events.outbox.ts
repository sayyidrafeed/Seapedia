import { createOutbox } from '@seapedia/platform/outbox';
import { db } from '@/db';
import { outbox } from '@/db/schema';

/**
 * Commerce's published events. Every write that changes stock or completes an order must call
 * `commerceOutbox.enqueue(tx, ...)` inside the same transaction.
 *
 * - inventory: stock changed (checkout, seller restock, overdue return) -> catalog's stock read model
 * - sales: an order completed -> catalog recomputes sold counts (they rank search results)
 */
export const commerceOutbox = createOutbox({
  db,
  table: outbox,
  subscriptions: {
    inventory: ['catalog'],
    sales: ['catalog'],
  },
});
