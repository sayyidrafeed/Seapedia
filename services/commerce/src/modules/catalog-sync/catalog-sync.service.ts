import { dataOf } from '@seapedia/contracts/events';
import type { EventEnvelope } from '@seapedia/platform/events';
import { and, eq, lt, sql } from 'drizzle-orm';
import { db } from '@/db';
import { cartItems, inventory, pendingStock, productRefs, storeRefs, userRefs } from '@/db/schema';
import { CommerceEvents, commerceOutbox } from '@/modules/events/events.index';

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

// Stock a seller set before the product replicated: applied now if the store is theirs, else dropped.
async function applyPendingStock(tx: Tx, productId: string, storeId: string) {
  const [pending] = await tx
    .select()
    .from(pendingStock)
    .where(eq(pendingStock.productId, productId))
    .limit(1);
  if (!pending) return;
  await tx.delete(pendingStock).where(eq(pendingStock.productId, productId));
  const [owner] = await tx
    .select({ id: storeRefs.id })
    .from(storeRefs)
    .where(and(eq(storeRefs.id, storeId), eq(storeRefs.sellerId, pending.sellerId)))
    .limit(1);
  if (!owner) return;
  const [row] = await tx
    .update(inventory)
    .set({ stock: pending.stock, version: sql`${inventory.version} + 1`, updatedAt: new Date() })
    .where(eq(inventory.productId, productId))
    .returning({
      productId: inventory.productId,
      stock: inventory.stock,
      version: inventory.version,
    });
  if (row) await commerceOutbox.enqueue(tx, CommerceEvents.inventoryChanged(row));
}

// Serializes a product's replica write with a seller setting its stock, so stock accepted while
// the product was still replicating is always either seen here or applied by the setter.
export async function lockProduct(tx: Tx, productId: string) {
  await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${productId}))`);
}

// Version-guarded writes make redeliveries and reordering harmless; a missing store ref fails and retries.
export const ReplicaSync = {
  async productUpserted(event: EventEnvelope) {
    const p = dataOf('catalog.product.upserted', event);
    const ref = {
      id: p.id,
      storeId: p.storeId,
      name: p.name,
      slug: p.slug,
      price: p.price,
      imageKey: p.imageKey,
    };
    await db.transaction(async (tx) => {
      await lockProduct(tx, p.id);
      const applied = await tx
        .insert(productRefs)
        .values({ ...ref, version: event.version })
        .onConflictDoUpdate({
          target: productRefs.id,
          set: { ...ref, version: event.version, syncedAt: sql`now()` },
          // A tombstoned product stays deleted: its version is above any earlier upsert.
          setWhere: lt(productRefs.version, event.version),
        })
        .returning({ id: productRefs.id, deleted: productRefs.deleted });
      if (applied.length === 0 || applied[0].deleted) return;
      // New products start with no stock until the seller sets it; existing stock is untouched.
      await tx.insert(inventory).values({ productId: p.id, stock: 0 }).onConflictDoNothing();
      await applyPendingStock(tx, p.id, p.storeId);
    });
  },

  async productDeleted(event: EventEnvelope) {
    const { id } = dataOf('catalog.product.deleted', event);
    await db.transaction(async (tx) => {
      const tombstoned = await tx
        .update(productRefs)
        .set({ deleted: true, version: event.version, syncedAt: sql`now()` })
        .where(and(eq(productRefs.id, id), lt(productRefs.version, event.version)))
        .returning({ id: productRefs.id });
      if (tombstoned.length === 0) return;
      await tx.delete(cartItems).where(eq(cartItems.productId, id));
      await tx.delete(inventory).where(eq(inventory.productId, id));
      await tx.delete(pendingStock).where(eq(pendingStock.productId, id));
    });
  },

  async storeUpserted(event: EventEnvelope) {
    const s = dataOf('catalog.store.upserted', event);
    const ref = { id: s.id, sellerId: s.sellerId, name: s.name, slug: s.slug };
    await db
      .insert(storeRefs)
      .values({ ...ref, version: event.version })
      .onConflictDoUpdate({
        target: storeRefs.id,
        set: { ...ref, version: event.version, syncedAt: sql`now()` },
        setWhere: lt(storeRefs.version, event.version),
      });
  },

  async userUpserted(event: EventEnvelope) {
    const u = dataOf('identity.user.updated', event);
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
      .where(and(eq(productRefs.id, productId), eq(productRefs.deleted, false)))
      .limit(1);
    return Boolean(row);
  },
};
