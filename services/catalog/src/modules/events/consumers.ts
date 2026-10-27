import { createEventConsumer, type EventEnvelope } from '@seapedia/platform/events';
import { MongoServerError } from 'mongodb';
import { z } from 'zod';
import { collections, inTransaction } from '@/db';
import { runtime } from '@/runtime';
import { CatalogEvents, enqueue } from './events';

const userData = z.object({ id: z.string(), displayName: z.string() });
const inventoryData = z.object({ productId: z.string(), stock: z.number().int() });
const orderCompletedData = z.object({
  orderId: z.string(),
  buyerId: z.string(),
  items: z.array(z.object({ productId: z.string().nullable(), quantity: z.number().int() })),
});

async function upsertUser(event: EventEnvelope) {
  const user = userData.parse(event.data);
  await collections.users
    .updateOne(
      { _id: user.id, $or: [{ version: { $lt: event.version } }, { version: { $exists: false } }] },
      { $set: { displayName: user.displayName, version: event.version } },
      { upsert: true },
    )
    .catch((error) => {
      // A newer version already exists: the filter missed and the upsert collided on _id.
      if (!(error instanceof MongoServerError && error.code === 11000)) throw error;
    });
}

export const consumer = createEventConsumer({
  rabbit: runtime.rabbit,
  queue: 'catalog',
  handlers: {
    'identity.user.registered': upsertUser,
    'identity.user.updated': upsertUser,

    'commerce.inventory.changed': async (event) => {
      const { productId, stock } = inventoryData.parse(event.data);
      await collections.products.updateOne(
        { _id: productId, stockVersion: { $lt: event.version } },
        { $set: { stock, stockVersion: event.version } },
      );
    },

    // Not idempotent by itself (it increments), so the inbox records the event id in the same
    // transaction and a redelivery is skipped.
    'commerce.order.completed': async (event) => {
      const order = orderCompletedData.parse(event.data);
      await inTransaction(async (session) => {
        if (await collections.inbox.findOne({ _id: event.id }, { session })) return;
        await collections.inbox.insertOne(
          { _id: event.id, type: event.type, processedAt: new Date() },
          { session },
        );

        for (const item of order.items) {
          if (!item.productId) continue;
          await collections.purchases.updateOne(
            { _id: `${order.buyerId}:${item.productId}` },
            { $setOnInsert: { buyerId: order.buyerId, productId: item.productId, at: new Date() } },
            { upsert: true, session },
          );
          const product = await collections.products.findOneAndUpdate(
            { _id: item.productId },
            { $inc: { soldCount: item.quantity, version: 1 }, $set: { updatedAt: new Date() } },
            { session, returnDocument: 'after' },
          );
          if (product) await enqueue(session, CatalogEvents.productUpserted(product));
        }
      });
    },
  },
});
