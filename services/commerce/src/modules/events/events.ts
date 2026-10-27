import { createEvent } from '@seapedia/platform/events';
import { createPostgresOutbox } from '@seapedia/platform/events/postgres';
import { db } from '@/db';
import { outbox } from '@/db/schema';

// commerce's outbox: enqueue inside the transaction that made the change.
export const commerceOutbox = createPostgresOutbox(db, outbox);

export const CommerceEvents = {
  // Current stock of a product; catalog shows it, checkout never reads catalog's copy.
  inventoryChanged(row: { productId: string; stock: number; version: number }) {
    return createEvent(
      'commerce',
      'commerce.inventory.changed',
      { productId: row.productId, stock: row.stock },
      row.version,
    );
  },
  // A delivered order: catalog unlocks reviews for these products and counts the units sold.
  orderCompleted(
    order: { id: string; buyerId: string },
    items: { productId: string | null; quantity: number }[],
  ) {
    return createEvent(
      'commerce',
      'commerce.order.completed',
      { orderId: order.id, buyerId: order.buyerId, items },
      1,
    );
  },
};
