import { createEventConsumer, type EventEnvelope } from '@seapedia/platform/events';
import { eq, lt, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { inventory, productRefs, storeRefs, userRefs } from '@/db/schema';
import { runtime } from '@/runtime';

const productData = z.object({
  id: z.string(),
  storeId: z.string(),
  name: z.string(),
  slug: z.string(),
  price: z.number().int(),
  imageKey: z.string().nullable(),
});
const storeData = z.object({
  id: z.string(),
  sellerId: z.string(),
  name: z.string(),
  slug: z.string(),
});
const userData = z.object({ id: z.string(), roles: z.array(z.string()) });

/**
 * Applies other services' events to commerce's replicas. Events carry full state and a version;
 * each write only wins over an older version, so redeliveries and reordering are harmless. A
 * product whose store has not replicated yet fails the foreign key and is retried later.
 */
export const ReplicaSync = {
  async productUpserted(event: EventEnvelope) {
    const p = productData.parse(event.data);
    await db.transaction(async (tx) => {
      await tx
        .insert(productRefs)
        .values({ ...p, version: event.version })
        .onConflictDoUpdate({
          target: productRefs.id,
          set: {
            storeId: p.storeId,
            name: p.name,
            slug: p.slug,
            price: p.price,
            imageKey: p.imageKey,
            version: event.version,
            syncedAt: sql`now()`,
          },
          setWhere: lt(productRefs.version, event.version),
        });
      // New products start with no stock until the seller sets it; existing stock is untouched.
      await tx.insert(inventory).values({ productId: p.id, stock: 0 }).onConflictDoNothing();
    });
  },

  async productDeleted(event: EventEnvelope) {
    const { id } = z.object({ id: z.string() }).parse(event.data);
    // Cascades to inventory and cart items; order items keep their name and price snapshot.
    await db.delete(productRefs).where(eq(productRefs.id, id));
  },

  async storeUpserted(event: EventEnvelope) {
    const s = storeData.parse(event.data);
    await db
      .insert(storeRefs)
      .values({ ...s, version: event.version })
      .onConflictDoUpdate({
        target: storeRefs.id,
        set: {
          sellerId: s.sellerId,
          name: s.name,
          slug: s.slug,
          version: event.version,
          syncedAt: sql`now()`,
        },
        setWhere: lt(storeRefs.version, event.version),
      });
  },

  async userUpserted(event: EventEnvelope) {
    const u = userData.parse(event.data);
    await db
      .insert(userRefs)
      .values({ id: u.id, roles: u.roles, version: event.version })
      .onConflictDoUpdate({
        target: userRefs.id,
        set: { roles: u.roles, version: event.version, syncedAt: sql`now()` },
        setWhere: lt(userRefs.version, event.version),
      });
  },

  async hasProduct(productId: string) {
    const [row] = await db
      .select({ id: productRefs.id })
      .from(productRefs)
      .where(eq(productRefs.id, productId))
      .limit(1);
    return Boolean(row);
  },
};

export const replicaConsumer = createEventConsumer({
  rabbit: runtime.rabbit,
  queue: 'commerce',
  handlers: {
    'catalog.product.upserted': ReplicaSync.productUpserted,
    'catalog.product.deleted': ReplicaSync.productDeleted,
    'catalog.store.upserted': ReplicaSync.storeUpserted,
    'identity.user.registered': ReplicaSync.userUpserted,
    'identity.user.updated': ReplicaSync.userUpserted,
  },
});
