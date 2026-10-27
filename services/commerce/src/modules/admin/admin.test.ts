import { describe, expect, test } from 'bun:test';
import { randomUUID } from 'node:crypto';
import { authenticate } from '@seapedia/platform/auth';
import type { ServiceEnv } from '@seapedia/platform/factory';
import { eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { db } from '@/db';
import {
  inventory,
  orders,
  orderStatusHistory,
  productRefs,
  userRefs,
  wallets,
  walletTransactions,
} from '@/db/schema';
import { runtime } from '@/runtime';
import { outboxEvents } from '../../../test/db';
import { seedOrder, seedProduct, seedStore, seedWallet } from '../../../test/fixtures';
import { accessCookie } from '../../../test/tokens';
import { adminRouter } from './admin.index';
import { AdminService } from './admin.service';

const app = new Hono<ServiceEnv>();
app.use('*', authenticate(runtime.verifier, runtime.denylist));
app.route('/api/admin', adminRouter);

const adminCookie = await accessCookie('admin');
const hoursAgo = (h: number) => new Date(Date.now() - h * 3_600_000);

describe('admin routes', () => {
  test('refuse requests without a token or without the admin role', async () => {
    expect((await app.request('/api/admin/dashboard')).status).toBe(401);
    const asBuyer = { headers: { cookie: await accessCookie('buyer') } };
    expect((await app.request('/api/admin/dashboard', asBuyer)).status).toBe(403);
  });

  test('dashboard counts replicas, live products, orders by status, and overdue orders', async () => {
    await db.insert(userRefs).values([
      { id: randomUUID(), roles: ['buyer', 'seller'], version: 1 },
      { id: randomUUID(), roles: ['buyer', 'driver'], version: 1 },
      { id: randomUUID(), roles: ['admin'], version: 1 },
    ]);
    const store = await seedStore();
    await seedProduct(store.id);
    const deleted = await seedProduct(store.id);
    await db.update(productRefs).set({ deleted: true }).where(eq(productRefs.id, deleted.id));
    const buyerId = randomUUID();
    await seedOrder({ buyerId, storeId: store.id, status: 'pesanan_selesai' });
    await seedOrder({
      buyerId,
      storeId: store.id,
      deliveryMethod: 'instant',
      createdAt: hoursAgo(3),
    });
    await seedOrder({
      buyerId,
      storeId: store.id,
      deliveryMethod: 'regular',
      createdAt: hoursAgo(3),
    });

    const res = await app.request('/api/admin/dashboard', { headers: { cookie: adminCookie } });

    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({
      users: { total: 3, roles: { admin: 1, buyer: 2, seller: 1, driver: 1 } },
      stores: { total: 1 },
      products: { total: 1 },
      orders: { total: 3, statuses: { pesanan_selesai: 1, sedang_dikemas: 2 } },
      overdueOrders: { total: 1 },
    });
  });

  test('time simulation rejects more than 240 hours', async () => {
    const res = await app.request('/api/admin/dashboard/time/simulate', {
      method: 'POST',
      headers: { cookie: adminCookie, 'Content-Type': 'application/json' },
      body: JSON.stringify({ hoursToAdvance: 300 }),
    });
    expect(res.status).toBe(400);
  });
});

describe('time simulation', () => {
  test('advances accumulate, are capped at 240 hours, and 0 resets', async () => {
    await AdminService.simulateTime(1);
    expect((await AdminService.simulateTime(2)).newOffsetHours).toBe(3);
    expect((await AdminService.simulateTime(239)).newOffsetHours).toBe(240);
    expect((await AdminService.simulateTime(0)).newOffsetHours).toBe(0);
  });

  test('simulated time makes an order overdue', async () => {
    const store = await seedStore();
    await seedOrder({ buyerId: randomUUID(), storeId: store.id, deliveryMethod: 'next_day' });
    expect((await AdminService.getDashboardStats()).overdueOrders.total).toBe(0);

    await AdminService.simulateTime(25);

    expect((await AdminService.getDashboardStats()).overdueOrders.total).toBe(1);
  });
});

describe('overdue processing', () => {
  async function overdueOrder(status = 'menunggu_pengirim') {
    const store = await seedStore();
    const product = await seedProduct(store.id, { price: 45_000, stock: 5 });
    const buyerId = randomUUID();
    await seedWallet(buyerId, 50_000);
    const order = await seedOrder(
      { buyerId, storeId: store.id, deliveryMethod: 'instant', status, createdAt: hoursAgo(3) },
      [{ productId: product.id, quantity: 2, price: 45_000 }],
    );
    return { order, product, buyerId };
  }

  test('returns the order, refunds the wallet, restores stock, and announces it', async () => {
    const { order, product, buyerId } = await overdueOrder();

    const res = await app.request('/api/admin/dashboard/overdue/process', {
      method: 'POST',
      headers: { cookie: adminCookie },
    });

    expect(await res.json()).toMatchObject({
      processedCount: 1,
      results: [{ orderId: order.id, refundAmount: 100_000, itemsRestored: 2 }],
    });
    const [returned] = await db.select().from(orders).where(eq(orders.id, order.id));
    expect(returned.status).toBe('dikembalikan');
    const [wallet] = await db.select().from(wallets).where(eq(wallets.userId, buyerId));
    expect(wallet.balance).toBe(150_000);
    expect(await db.select().from(walletTransactions)).toMatchObject([
      { walletId: wallet.id, amount: 100_000, type: 'refund', reference: `REFUND-${order.id}` },
    ]);
    const [stock] = await db.select().from(inventory).where(eq(inventory.productId, product.id));
    expect(stock).toMatchObject({ stock: 7, version: 1 });
    expect(await outboxEvents()).toMatchObject([
      { type: 'commerce.inventory.changed', version: 1, data: { productId: product.id, stock: 7 } },
    ]);
    expect(await db.select().from(orderStatusHistory)).toHaveLength(1);
  });

  test('a second run refunds nothing', async () => {
    const { buyerId } = await overdueOrder();
    await AdminService.processOverdueOrders();

    expect((await AdminService.processOverdueOrders()).processedCount).toBe(0);
    const [wallet] = await db.select().from(wallets).where(eq(wallets.userId, buyerId));
    expect(wallet.balance).toBe(150_000);
  });

  test('completed or returned orders are never refunded', async () => {
    await overdueOrder('pesanan_selesai');
    await overdueOrder('dikembalikan');

    expect((await AdminService.processOverdueOrders()).processedCount).toBe(0);
    expect(await db.select().from(walletTransactions)).toEqual([]);
  });
});
