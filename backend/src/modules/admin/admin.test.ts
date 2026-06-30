import { describe, expect, test, mock, beforeEach } from 'bun:test';

const testState = {
  hasSession: true,
  activeRole: 'admin',
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
      from: () => ({
        where: () => ({
          limit: () => {
            if (!testState.hasSession) return Promise.resolve([]);
            return Promise.resolve([
              {
                id: 'test-session',
                userId: 'test-user',
                activeRole: testState.activeRole,
              },
            ]);
          },
        }),
      }),
    });
  }

  return {
    db: {
      select: makeSelect(),
      insert: () => ({ values: () => ({ returning: () => Promise.resolve([]) }) }),
      update: () => ({ set: () => ({ where: () => ({ returning: () => Promise.resolve([]) }) }) }),
      delete: () => ({ where: () => Promise.resolve(undefined) }),
    },
    schema: {},
  };
});

mock.module('./admin.service', () => ({
  AdminService: {
    getDashboardStats: () =>
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
      }),
  },
}));

import { Hono } from 'hono';
import { adminRouter } from './admin.index';

function createTestApp() {
  const app = new Hono();
  app.route('/api/admin', adminRouter);
  return app;
}

describe('Admin Dashboard Route Authorization', () => {
  beforeEach(() => {
    testState.hasSession = true;
    testState.activeRole = 'admin';
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
    const data = (await res.json()) as unknown as {
      users: { total: number };
      stores: { total: number };
      products: { total: number };
    };
    expect(data.users.total).toBe(4);
    expect(data.stores.total).toBe(2);
    expect(data.products.total).toBe(10);
  });
});
