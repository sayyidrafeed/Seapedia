import { eq, inArray, sql } from 'drizzle-orm';
import type { OutboxEvent } from '@seapedia/platform/outbox';
import { z } from 'zod';
import { db } from '@/db';
import { inventory, productRefs, storeRefs } from '@/db/schema';
import { catalogClient } from '@/modules/clients/clients.index';

const productRefsSchema = z.object({
  products: z.array(
    z.object({
      id: z.string(),
      storeId: z.string(),
      name: z.string(),
      slug: z.string(),
      price: z.number().int(),
      imageKey: z.string().nullable(),
    }),
  ),
});
const storeRefsSchema = z.object({
  stores: z.array(
    z.object({ id: z.string(), sellerId: z.string(), name: z.string(), slug: z.string() }),
  ),
});

type ProductRef = z.infer<typeof productRefsSchema>['products'][number];

async function fetchProducts(ids: string[]) {
  if (ids.length === 0) return [];
  return (await catalogClient.get('/internal/products', productRefsSchema, { ids })).products;
}

async function fetchStores(ids: string[]) {
  if (ids.length === 0) return [];
  return (await catalogClient.get('/internal/stores', storeRefsSchema, { ids })).stores;
}

async function upsertStores(ids: string[]) {
  const stores = await fetchStores(ids);
  if (stores.length === 0) return;
  await db
    .insert(storeRefs)
    .values(stores)
    .onConflictDoUpdate({
      target: storeRefs.id,
      set: {
        sellerId: sql`excluded.seller_id`,
        name: sql`excluded.name`,
        slug: sql`excluded.slug`,
        syncedAt: sql`now()`,
      },
    });
}

async function upsertProducts(products: ProductRef[]) {
  if (products.length === 0) return;
  // Products may reference a store this replica has not seen yet.
  const known = await db
    .select({ id: storeRefs.id })
    .from(storeRefs)
    .where(inArray(storeRefs.id, [...new Set(products.map((p) => p.storeId))]));
  const knownIds = new Set(known.map((s) => s.id));
  await upsertStores(
    [...new Set(products.map((p) => p.storeId))].filter((id) => !knownIds.has(id)),
  );

  await db.transaction(async (tx) => {
    await tx
      .insert(productRefs)
      .values(products)
      .onConflictDoUpdate({
        target: productRefs.id,
        set: {
          storeId: sql`excluded.store_id`,
          name: sql`excluded.name`,
          slug: sql`excluded.slug`,
          price: sql`excluded.price`,
          imageKey: sql`excluded.image_key`,
          syncedAt: sql`now()`,
        },
      });
    // New products start with no stock until the seller sets it; existing stock is untouched.
    await tx
      .insert(inventory)
      .values(products.map((p) => ({ productId: p.id, stock: 0 })))
      .onConflictDoNothing();
  });
}

/**
 * Keeps product_refs / store_refs in step with catalog. Catalog is the owner; these are replicas.
 */
export const CatalogRefs = {
  /**
   * Applies a batch of catalog events by re-reading catalog's current state. A product catalog no
   * longer returns was deleted: its ref goes, cascading to inventory and cart items.
   */
  async applyEvents(events: OutboxEvent[]) {
    const storeIds = [...new Set(events.filter((e) => e.topic === 'store').map((e) => e.entityId))];
    const productIds = [
      ...new Set(events.filter((e) => e.topic === 'product').map((e) => e.entityId)),
    ];

    await upsertStores(storeIds);

    const current = await fetchProducts(productIds);
    await upsertProducts(current);

    const present = new Set(current.map((p) => p.id));
    const deleted = productIds.filter((id) => !present.has(id));
    if (deleted.length > 0) {
      await db.delete(productRefs).where(inArray(productRefs.id, deleted));
    }
  },

  /**
   * Read-through for a product that may not have replicated yet (e.g. created a moment ago).
   * Returns false when catalog does not know the product either.
   */
  async ensureProduct(productId: string): Promise<boolean> {
    const [local] = await db
      .select({ id: productRefs.id })
      .from(productRefs)
      .where(eq(productRefs.id, productId))
      .limit(1);
    if (local) return true;

    const products = await fetchProducts([productId]);
    await upsertProducts(products);
    return products.length > 0;
  },
};
