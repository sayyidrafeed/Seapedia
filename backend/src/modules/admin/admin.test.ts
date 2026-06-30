import { describe, expect, test, mock, beforeEach } from 'bun:test';
import { activeSession } from '@/db/schema';
import { AdminService } from './admin.service';

const testState = {
  hasSession: true,
  activeRole: 'admin',
};

const dbState = {
  selectQueue: [] as unknown[][],
  insertQueue: [] as unknown[][],
  updateQueue: [] as unknown[][],
  selectIdx: 0,
  insertIdx: 0,
  updateIdx: 0,

  reset() {
    this.selectQueue = [];
    this.insertQueue = [];
    this.updateQueue = [];
    this.selectIdx = 0;
    this.insertIdx = 0;
    this.updateIdx = 0;
  },

  addSelect(data: unknown[]) {
    this.selectQueue.push(data);
  },
  addInsert(data: unknown[]) {
    this.insertQueue.push(data);
  },
  addUpdate(data: unknown[]) {
    this.updateQueue.push(data);
  },
};

mock.module('hono/cookie', () => ({
  getCookie: () => (testState.hasSession ? 'valid-token' : undefined),
  setCookie: () => {},
  deleteCookie: () => {},
}));

mock.module('@/lib/jwt', () => ({
  verifyJwt: () =>
    testState.hasSession ? { userId: 'test-user', sessionId: 'test-session' } : null,
  signJwt: () => 'mocked-token',
}));

mock.module('@/db', () => {
  function makeSelect() {
    return () => ({
      from: (table: unknown) => {
        const isSessionQuery = table === activeSession;

        if (isSessionQuery) {
          const sessionData = testState.hasSession
            ? [
                {
                  id: 'test-session',
                  userId: 'test-user',
                  activeRole: testState.activeRole,
                },
              ]
            : [];
          const builder = Object.assign(Promise.resolve(sessionData), {
            where: () => {
              const whereBuilder = Object.assign(Promise.resolve(sessionData), {
                limit: () => Promise.resolve(sessionData),
              });
              return whereBuilder;
            },
          });
          return builder;
        }

        const idx = dbState.selectIdx++;
        const data = dbState.selectQueue[idx] ?? [];
        const createQueryBuilder = (res: unknown): unknown => {
          const builder = Object.assign(Promise.resolve(res), {
            where: () => createQueryBuilder(res),
            limit: (n: number) => createQueryBuilder(Array.isArray(res) ? res.slice(0, n) : res),
            orderBy: () => createQueryBuilder(res),
            for: () => createQueryBuilder(res),
          });
          return builder;
        };
        return createQueryBuilder(data);
      },
    });
  }

  function makeInsert() {
    return () => ({
      values: () => {
        const idx = dbState.insertIdx;
        const returningFn = () => {
          dbState.insertIdx++;
          return Promise.resolve(dbState.insertQueue[idx] ?? []);
        };
        return {
          returning: returningFn,
          onConflictDoUpdate: () => ({ returning: returningFn }),
          onConflictDoNothing: () => ({ returning: returningFn }),
        };
      },
    });
  }

  function makeUpdate() {
    return () => ({
      set: () => ({
        where: () => {
          const idx = dbState.updateIdx;
          return Object.assign(Promise.resolve(undefined), {
            returning: () => {
              dbState.updateIdx++;
              return Promise.resolve(dbState.updateQueue[idx] ?? []);
            },
          });
        },
      }),
    });
  }

  const dbSelect = makeSelect();
  const dbInsert = makeInsert();
  const dbUpdate = makeUpdate();

  return {
    db: {
      select: dbSelect,
      insert: dbInsert,
      update: dbUpdate,
      delete: () => ({ where: () => Promise.resolve(undefined) }),
      transaction: <T>(
        cb: (tx: {
          select: typeof dbSelect;
          insert: typeof dbInsert;
          update: typeof dbUpdate;
        }) => Promise<T>,
      ) =>
        cb({
          select: dbSelect,
          insert: dbInsert,
          update: dbUpdate,
        }),
    },
    schema: {},
  };
});

import { Hono } from 'hono';
import { adminRouter } from './admin.index';

function createTestApp() {
  const app = new Hono();
  app.route('/api/admin', adminRouter);
  return app;
}

const originalGetDashboardStats = AdminService.getDashboardStats;
const originalProcessOverdueOrders = AdminService.processOverdueOrders;
const originalSimulateTime = AdminService.simulateTime;

describe('Admin Dashboard Route Authorization', () => {
  beforeEach(() => {
    testState.hasSession = true;
    testState.activeRole = 'admin';
    dbState.reset();

    // Stub service methods for routes testing
    AdminService.getDashboardStats = () =>
      Promise.resolve({
        users: { total: 4, roles: { admin: 1, buyer: 1, seller: 1, driver: 1 } },
        stores: { total: 2 },
        products: { total: 10 },
        orders: {
          total: 5,
          statuses: {
            sedang_dikemas: 1,
            menunggu_pengirim: 1,
            sedang_dikirim: 1,
            pesanan_selesai: 1,
            dikembalikan: 1,
          },
        },
        discounts: { vouchers: 2, promos: 3 },
        deliveries: { total: 3, statuses: { pending: 1, taken: 1, completed: 1 } },
        overdueOrders: { total: 0 },
      });
    AdminService.processOverdueOrders = () =>
      Promise.resolve({
        processedCount: 1,
        results: [
          {
            orderId: 'order-1',
            buyerId: 'buyer-1',
            refundAmount: 100000,
            itemsRestored: 2,
            note: 'mocked note',
          },
        ],
      });
    AdminService.simulateTime = (hours: number) =>
      Promise.resolve({
        newOffsetHours: hours,
        effectiveTime: '2026-07-01T18:17:07.000Z',
      });
  });

  test('returns 401 when no session cookie is provided', async () => {
    testState.hasSession = false;
    const app = createTestApp();
    const res = await app.request('/api/admin/dashboard');

    expect(res.status).toBe(401);
  });

  test('returns 403 when active role is not admin', async () => {
    testState.activeRole = 'buyer';
    const app = createTestApp();
    const res = await app.request('/api/admin/dashboard');

    expect(res.status).toBe(403);
  });

  test('returns 200 and stats when authorized as admin', async () => {
    testState.activeRole = 'admin';
    const app = createTestApp();
    const res = await app.request('/api/admin/dashboard');

    expect(res.status).toBe(200);
    const data = (await res.json()) as {
      users: { total: number };
      stores: { total: number };
      products: { total: number };
    };
    expect(data.users.total).toBe(4);
    expect(data.stores.total).toBe(2);
    expect(data.products.total).toBe(10);
  });

  test('POST /api/admin/dashboard/overdue/process returns 200 and processed count', async () => {
    const app = createTestApp();
    const res = await app.request('/api/admin/dashboard/overdue/process', {
      method: 'POST',
    });

    expect(res.status).toBe(200);
    const data = (await res.json()) as {
      processedCount: number;
      results: Array<{ orderId: string }>;
    };
    expect(data.processedCount).toBe(1);
    expect(data.results[0].orderId).toBe('order-1');
  });

  test('POST /api/admin/dashboard/time/simulate returns 200 and simulated offset info', async () => {
    const app = createTestApp();
    const res = await app.request('/api/admin/dashboard/time/simulate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ hoursToAdvance: 24 }),
    });

    expect(res.status).toBe(200);
    const data = (await res.json()) as { newOffsetHours: number; effectiveTime: string };
    expect(data.newOffsetHours).toBe(24);
    expect(data.effectiveTime).toBe('2026-07-01T18:17:07.000Z');
  });

  test('POST /api/admin/dashboard/time/simulate returns 400 for invalid request body', async () => {
    const app = createTestApp();
    const res = await app.request('/api/admin/dashboard/time/simulate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ hoursToAdvance: 300 }), // max is 240
    });

    expect(res.status).toBe(400);
  });
});

describe('AdminService Time Simulation', () => {
  beforeEach(() => {
    dbState.reset();
    AdminService.getDashboardStats = originalGetDashboardStats;
    AdminService.processOverdueOrders = originalProcessOverdueOrders;
    AdminService.simulateTime = originalSimulateTime;
  });

  test('simulateTime updates offsetSeconds', async () => {
    dbState.addSelect([{ id: 1, offsetSeconds: 0 }]); // initial offset check
    dbState.addInsert([{ id: 1, offsetSeconds: 3600 }]); // returning from simulateTime insert

    const result = await AdminService.simulateTime(1);
    expect(result.newOffsetHours).toBe(1);
    expect(result.effectiveTime).toBeDefined();
  });

  test('simulateTime resets when hoursToAdvance is 0', async () => {
    dbState.addSelect([{ id: 1, offsetSeconds: 3600 }]); // current offset is 1 hour
    dbState.addInsert([{ id: 1, offsetSeconds: 0 }]); // reset offset returning

    const result = await AdminService.simulateTime(0);
    expect(result.newOffsetHours).toBe(0);
  });
});

describe('AdminService Overdue Processing', () => {
  beforeEach(() => {
    dbState.reset();
    AdminService.getDashboardStats = originalGetDashboardStats;
    AdminService.processOverdueOrders = originalProcessOverdueOrders;
    AdminService.simulateTime = originalSimulateTime;
  });

  test('processes overdue orders correctly and refunds wallet and stock', async () => {
    // 1. getEffectiveNow offset check
    dbState.addSelect([{ id: 1, offsetSeconds: 25 * 3600 }]); // simulate 25 hours offset (enough for instant or next_day)

    // 2. allOrders query
    const sampleOrder = {
      id: 'order-1',
      buyerId: 'buyer-1',
      storeId: 'store-1',
      deliveryMethod: 'instant',
      status: 'menunggu_pengirim',
      totalAmount: 100000,
      createdAt: new Date(Date.now() - 3 * 3600 * 1000), // created 3 hours ago (SLA: 2 hours)
    };
    dbState.addSelect([sampleOrder]);

    // 3. transaction select orders for update
    dbState.addSelect([sampleOrder]);

    // 4. select wallets for refund
    dbState.addSelect([{ id: 'wallet-1', userId: 'buyer-1', balance: 50000 }]);

    // 5. select orderItems
    dbState.addSelect([{ id: 'item-1', productId: 'product-1', quantity: 2 }]);

    const result = await AdminService.processOverdueOrders();
    expect(result.processedCount).toBe(1);
    expect(result.results[0].refundAmount).toBe(100000);
    expect(result.results[0].itemsRestored).toBe(2);
  });

  test('prevents double refund/stock restore if order status is already completed or returned', async () => {
    // Test that if status is 'dikembalikan' it is skipped
    dbState.addSelect([{ id: 1, offsetSeconds: 25 * 3600 }]); // getEffectiveNow

    const sampleOrder = {
      id: 'order-1',
      buyerId: 'buyer-1',
      storeId: 'store-1',
      deliveryMethod: 'instant',
      status: 'dikembalikan', // already returned!
      totalAmount: 100000,
      createdAt: new Date(Date.now() - 3 * 3600 * 1000),
    };
    dbState.addSelect([sampleOrder]); // allOrders select

    // Since it's filtered out from the overdue list inside processOverdueOrders list filter,
    // it won't even start a transaction.
    const result = await AdminService.processOverdueOrders();
    expect(result.processedCount).toBe(0);
  });

  test('prevents double refund/stock restore if status changes concurrently before locking', async () => {
    // Test the transaction-level idempotency guard:
    // If order was waiting, but when locked inside the transaction it has already been processed or completed:
    dbState.addSelect([{ id: 1, offsetSeconds: 25 * 3600 }]); // getEffectiveNow

    const sampleOrder = {
      id: 'order-1',
      buyerId: 'buyer-1',
      storeId: 'store-1',
      deliveryMethod: 'instant',
      status: 'menunggu_pengirim',
      totalAmount: 100000,
      createdAt: new Date(Date.now() - 3 * 3600 * 1000),
    };
    dbState.addSelect([sampleOrder]); // allOrders select

    // Inside transaction: select orders for update returns 'dikembalikan' (completed concurrently by another worker)
    const concurrentReturnedOrder = { ...sampleOrder, status: 'dikembalikan' };
    dbState.addSelect([concurrentReturnedOrder]);

    const result = await AdminService.processOverdueOrders();
    expect(result.processedCount).toBe(0); // Should skip and process 0
  });
});
