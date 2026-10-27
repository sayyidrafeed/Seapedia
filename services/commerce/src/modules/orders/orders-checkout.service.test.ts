import { describe, expect, test } from 'bun:test';
import { randomUUID } from 'node:crypto';
import { NotFoundError, ValidationError } from '@seapedia/platform/errors';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import {
  cartItems,
  carts,
  inventory,
  orderItems,
  orders,
  vouchers,
  wallets,
  walletTransactions,
} from '@/db/schema';
import { outboxEvents } from '../../../test/db';
import { seedAddress, seedProduct, seedStore, seedWallet } from '../../../test/fixtures';
import { OrdersCheckoutService } from './orders-checkout.service';

const buyerId = randomUUID();

// A buyer with an address, a wallet, and a cart holding `quantity` of each product.
async function readyToCheckout(
  products: { stock: number; quantity: number; id?: string }[],
  balance = 200_000,
) {
  const store = await seedStore();
  const address = await seedAddress(buyerId);
  await seedWallet(buyerId, balance);
  const [cart] = await db.insert(carts).values({ buyerId, storeId: store.id }).returning();
  const seeded = [];
  for (const p of products) {
    const product = await seedProduct(store.id, { stock: p.stock, id: p.id });
    await db
      .insert(cartItems)
      .values({ cartId: cart.id, productId: product.id, quantity: p.quantity });
    seeded.push(product);
  }
  return { address, products: seeded };
}

const stockOf = async (productId: string) =>
  (await db.select().from(inventory).where(eq(inventory.productId, productId)))[0];

describe('calculateTotals', () => {
  test('adds the configured delivery fee and 12% PPN', () => {
    expect(OrdersCheckoutService.calculateTotals(100_000, 'instant')).toMatchObject({
      deliveryFee: 30_000,
      ppn: 15_600,
      totalAmount: 145_600,
    });
    expect(OrdersCheckoutService.calculateTotals(100_000, 'regular')).toMatchObject({
      deliveryFee: 10_000,
      ppn: 13_200,
      totalAmount: 123_200,
    });
  });

  test('taxes the discounted subtotal', () => {
    expect(OrdersCheckoutService.calculateTotals(100_000, 'regular', 20_000)).toMatchObject({
      discountedSubtotal: 80_000,
      taxBase: 90_000,
      ppn: 10_800,
      totalAmount: 100_800,
    });
  });
});

describe('createOrder', () => {
  test('refuses an address the buyer does not own', async () => {
    const someoneElses = await seedAddress(randomUUID());
    await expect(
      OrdersCheckoutService.createOrder(buyerId, 'regular', someoneElses.id),
    ).rejects.toThrow(NotFoundError);
  });

  test('refuses an empty cart', async () => {
    const address = await seedAddress(buyerId);
    await expect(OrdersCheckoutService.createOrder(buyerId, 'regular', address.id)).rejects.toThrow(
      ValidationError,
    );
  });

  test('refuses when the wallet cannot cover the total', async () => {
    const { address } = await readyToCheckout([{ stock: 10, quantity: 2 }], 5_000);
    await expect(OrdersCheckoutService.createOrder(buyerId, 'regular', address.id)).rejects.toThrow(
      'Insufficient wallet balance',
    );
  });

  test('a short item rolls back the stock already taken for the others', async () => {
    // Checkout takes stock in product id order, so the short item is reached second.
    const { address, products } = await readyToCheckout(
      [
        { stock: 10, quantity: 2, id: '00000000-0000-4000-8000-000000000001' },
        { stock: 1, quantity: 2, id: '00000000-0000-4000-8000-000000000002' },
      ],
      500_000,
    );

    await expect(OrdersCheckoutService.createOrder(buyerId, 'regular', address.id)).rejects.toThrow(
      'Insufficient stock',
    );

    for (const [i, stock] of [10, 1].entries()) {
      expect(await stockOf(products[i].id)).toMatchObject({ stock, version: 0 });
    }
    expect(await db.select().from(orders)).toEqual([]);
    expect(await outboxEvents()).toEqual([]);
  });

  test('pays from the wallet, takes stock, records the order, and empties the cart', async () => {
    const { address, products } = await readyToCheckout([{ stock: 10, quantity: 2 }]);

    const order = await OrdersCheckoutService.createOrder(buyerId, 'regular', address.id);

    expect(order).toMatchObject({
      subtotal: 100_000,
      totalAmount: 123_200,
      status: 'sedang_dikemas',
    });
    expect(JSON.parse(order.addressSnapshot)).toMatchObject({
      id: address.id,
      city: 'Jakarta Selatan',
    });
    expect(await stockOf(products[0].id)).toMatchObject({ stock: 8, version: 1 });
    expect(await outboxEvents()).toMatchObject([
      {
        type: 'commerce.inventory.changed',
        version: 1,
        data: { productId: products[0].id, stock: 8 },
      },
    ]);
    const [wallet] = await db.select().from(wallets).where(eq(wallets.userId, buyerId));
    expect(wallet.balance).toBe(200_000 - 123_200);
    expect(await db.select().from(walletTransactions)).toMatchObject([
      { amount: -123_200, type: 'payment' },
    ]);
    expect(await db.select().from(orderItems)).toMatchObject([
      { orderId: order.id, productId: products[0].id, quantity: 2, productPrice: 50_000 },
    ]);
    expect(await db.select().from(cartItems)).toEqual([]);
    expect((await db.select().from(carts))[0].storeId).toBeNull();
  });

  test('a voucher discounts the order and uses one redemption', async () => {
    const { address } = await readyToCheckout([{ stock: 10, quantity: 2 }]);
    await db.insert(vouchers).values({
      code: 'SAVE20',
      discountAmount: 20_000,
      minOrderAmount: 50_000,
      expiresAt: new Date(Date.now() + 86_400_000),
      remainingUsage: 5,
    });

    const order = await OrdersCheckoutService.createOrder(buyerId, 'regular', address.id, 'save20');

    expect(order).toMatchObject({
      discountAmount: 20_000,
      discountCode: 'SAVE20',
      discountType: 'voucher',
      totalAmount: 100_800,
    });
    expect((await db.select().from(vouchers))[0].remainingUsage).toBe(4);
  });
});
