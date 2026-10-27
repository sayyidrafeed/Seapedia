import { describe, expect, test } from 'bun:test';
import { randomUUID } from 'node:crypto';
import { ConflictError, NotFoundError } from '@seapedia/platform/errors';
import { db } from '@/db';
import { deliveryJobs } from '@/db/schema';
import { seedOrder, seedProduct, seedStore } from '../../../test/fixtures';
import { OrdersSellerService } from './orders-seller.service';

const sellerId = randomUUID();

async function storeWithOrder(status = 'sedang_dikemas') {
  const store = await seedStore(sellerId);
  const product = await seedProduct(store.id);
  const order = await seedOrder({ buyerId: randomUUID(), storeId: store.id, status }, [
    { productId: product.id, quantity: 1, price: 10_000 },
  ]);
  return { store, order };
}

describe('processOrder', () => {
  test('marks the order ready to ship, records why, and opens a delivery job', async () => {
    const { order } = await storeWithOrder();

    const result = await OrdersSellerService.processOrder(sellerId, order.id, 'Ready to ship');

    expect(result.status).toBe('menunggu_pengirim');
    expect(result.statusHistory).toMatchObject([
      { status: 'menunggu_pengirim', note: 'Ready to ship' },
    ]);
    expect(await db.select().from(deliveryJobs)).toMatchObject([
      { orderId: order.id, status: 'pending', deliveryFee: order.deliveryFee },
    ]);
  });

  test('a seller without a store, or another store, cannot see the order', async () => {
    const { order } = await storeWithOrder();
    await expect(OrdersSellerService.processOrder(randomUUID(), order.id)).rejects.toThrow(
      NotFoundError,
    );
    const otherSeller = (await seedStore()).sellerId;
    await expect(OrdersSellerService.processOrder(otherSeller, order.id)).rejects.toThrow(
      'Order not found',
    );
  });

  test('an order already past packing cannot be processed again', async () => {
    const { order } = await storeWithOrder('menunggu_pengirim');
    await expect(OrdersSellerService.processOrder(sellerId, order.id)).rejects.toThrow(
      ConflictError,
    );
    expect(await db.select().from(deliveryJobs)).toEqual([]);
  });
});

describe('getReport', () => {
  test('lists every order but counts only completed ones as income', async () => {
    const { store } = await storeWithOrder('pesanan_selesai');
    await seedOrder({ buyerId: randomUUID(), storeId: store.id, subtotal: 5_000 });

    const result = await OrdersSellerService.getReport(sellerId);

    expect(result).toMatchObject({ totalIncome: 10_000, totalOrders: 1, averageRevenue: 10_000 });
    expect(result.orders).toHaveLength(2);
    const completed = result.orders.find((o) => o.status === 'pesanan_selesai');
    expect(completed?.items).toMatchObject([{ productPrice: 10_000, quantity: 1 }]);
  });
});
