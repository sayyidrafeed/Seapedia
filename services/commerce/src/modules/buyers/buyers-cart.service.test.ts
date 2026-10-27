import { describe, expect, test } from 'bun:test';
import { randomUUID } from 'node:crypto';
import { ConflictError, ValidationError } from '@seapedia/platform/errors';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { cartItems, carts, productRefs } from '@/db/schema';
import { ProductSyncingError } from '@/modules/inventory/inventory.index';
import { seedProduct, seedStore } from '../../../test/fixtures';
import { BuyersCartService } from './buyers-cart.service';

const buyerId = randomUUID();

async function product(stock = 10) {
  const store = await seedStore();
  return await seedProduct(store.id, { stock });
}

describe('BuyersCartService', () => {
  test('getOrCreateCart creates one cart per buyer and reuses it', async () => {
    const first = await BuyersCartService.getOrCreateCart(buyerId);
    const second = await BuyersCartService.getOrCreateCart(buyerId);
    expect(second.id).toBe(first.id);
    expect(await db.select().from(carts)).toHaveLength(1);
  });

  test('getOrCreateCart releases the store of a cart left without items', async () => {
    const store = await seedStore();
    await db.insert(carts).values({ buyerId, storeId: store.id });

    expect((await BuyersCartService.getOrCreateCart(buyerId)).storeId).toBeNull();
  });

  test('a quantity of zero or less is refused', async () => {
    const p = await product();
    await expect(BuyersCartService.addItemToCart(buyerId, p.id, 0)).rejects.toThrow(
      ValidationError,
    );
    await expect(BuyersCartService.addItemToCart(buyerId, p.id, -2)).rejects.toThrow(
      ValidationError,
    );
  });

  test('a product not replicated yet, or deleted, asks the client to retry', async () => {
    await expect(BuyersCartService.addItemToCart(buyerId, randomUUID(), 1)).rejects.toThrow(
      ProductSyncingError,
    );
    const p = await product();
    await db.update(productRefs).set({ deleted: true }).where(eq(productRefs.id, p.id));
    await expect(BuyersCartService.addItemToCart(buyerId, p.id, 1)).rejects.toThrow(
      ProductSyncingError,
    );
  });

  test('adding binds the cart to the store and accumulates up to the stock', async () => {
    const p = await product(3);

    await BuyersCartService.addItemToCart(buyerId, p.id, 2);

    expect((await BuyersCartService.getCartSummary(buyerId)).storeId).toBe(p.storeId);
    await expect(BuyersCartService.addItemToCart(buyerId, p.id, 2)).rejects.toThrow(
      'Total quantity in cart would exceed stock (3)',
    );
    const item = await BuyersCartService.addItemToCart(buyerId, p.id, 1);
    expect(item.quantity).toBe(3);
  });

  test('a cart holds products from one store only', async () => {
    await BuyersCartService.addItemToCart(buyerId, (await product()).id, 1);
    await expect(BuyersCartService.addItemToCart(buyerId, (await product()).id, 1)).rejects.toThrow(
      ConflictError,
    );
  });

  test('removing the last item frees the cart for another store', async () => {
    const item = await BuyersCartService.addItemToCart(buyerId, (await product()).id, 1);

    await BuyersCartService.removeCartItem(buyerId, item.id);

    expect(await db.select().from(cartItems)).toEqual([]);
    expect((await db.select().from(carts))[0].storeId).toBeNull();
  });
});
