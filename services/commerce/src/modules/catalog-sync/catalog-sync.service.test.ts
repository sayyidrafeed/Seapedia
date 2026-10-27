import { describe, expect, test } from 'bun:test';
import { randomUUID } from 'node:crypto';
import { event } from '@seapedia/contracts/events';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { cartItems, carts, inventory, pendingStock, productRefs } from '@/db/schema';
import { InventoryService } from '@/modules/inventory/inventory.index';
import { outboxEvents } from '../../../test/db';
import { ReplicaSync } from './catalog-sync.service';

const sellerId = randomUUID();
const storeId = randomUUID();
const productId = randomUUID();

const storeUpserted = () =>
  ReplicaSync.storeUpserted(
    event(
      'catalog.store.upserted',
      {
        id: storeId,
        sellerId,
        name: 'Toko Laut',
        slug: 'toko-laut',
        logoKey: null,
        rating: 0,
        reviewCount: 0,
        totalProducts: 1,
      },
      1,
    ),
  );

const productUpserted = (version: number, price = 50_000) =>
  ReplicaSync.productUpserted(
    event(
      'catalog.product.upserted',
      {
        id: productId,
        storeId,
        name: 'Ikan Kerapu',
        slug: 'ikan-kerapu',
        description: null,
        price,
        imageKey: null,
        rating: 0,
        reviewCount: 0,
        soldCount: 0,
        createdAt: new Date().toISOString(),
      },
      version,
    ),
  );

const productDeleted = (version: number) =>
  ReplicaSync.productDeleted(event('catalog.product.deleted', { id: productId }, version));

const productRef = async () =>
  (await db.select().from(productRefs).where(eq(productRefs.id, productId)))[0];
const stock = async () =>
  (await db.select().from(inventory).where(eq(inventory.productId, productId)))[0];

describe('product replica', () => {
  test('a late, older upsert does not overwrite a newer one', async () => {
    await storeUpserted();
    await productUpserted(2, 60_000);
    await productUpserted(1, 50_000);

    expect(await productRef()).toMatchObject({ price: 60_000, version: 2 });
    expect(await stock()).toMatchObject({ stock: 0 });
  });

  test('a deleted product leaves carts and stays deleted when an older upsert arrives late', async () => {
    await storeUpserted();
    await productUpserted(1);
    const [cart] = await db.insert(carts).values({ buyerId: randomUUID(), storeId }).returning();
    await db.insert(cartItems).values({ cartId: cart.id, productId, quantity: 1 });

    await productDeleted(2);
    await productUpserted(1);

    expect(await productRef()).toMatchObject({ deleted: true, version: 2 });
    expect(await ReplicaSync.hasProduct(productId)).toBe(false);
    expect(await stock()).toBeUndefined();
    expect(await db.select().from(cartItems)).toEqual([]);
  });
});

describe('stock set before the product replicated', () => {
  test('is kept as pending and applied when the product arrives in a store of that seller', async () => {
    await storeUpserted();
    expect(await InventoryService.setStock(sellerId, productId, 7)).toEqual({
      productId,
      stock: 7,
      pending: true,
    });

    await productUpserted(1);

    expect(await stock()).toMatchObject({ stock: 7, version: 1 });
    expect(await db.select().from(pendingStock)).toEqual([]);
    expect(await outboxEvents()).toMatchObject([
      { type: 'commerce.inventory.changed', version: 1, data: { productId, stock: 7 } },
    ]);
  });

  test('is dropped when the product turns out to belong to another seller', async () => {
    await storeUpserted();
    await InventoryService.setStock(randomUUID(), productId, 7);

    await productUpserted(1);

    expect(await stock()).toMatchObject({ stock: 0, version: 0 });
    expect(await db.select().from(pendingStock)).toEqual([]);
    expect(await outboxEvents()).toEqual([]);
  });
});
