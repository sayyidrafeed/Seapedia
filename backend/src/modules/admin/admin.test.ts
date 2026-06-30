import { describe, expect, test, mock, beforeEach } from 'bun:test';
import { activeSession } from '@/db/schema';

const testState = {
  hasSession: true,
  activeRole: 'admin',
};

// Mock session and auth
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

// Mock DB state for sequential queries in getMonitoringStats
const dbQueries = {
  queue: [] as unknown[][],
  index: 0,
  reset() {
    this.queue = [];
    this.index = 0;
  },
  push(val: unknown) {
    this.queue.push([val]);
  },
};

mock.module('@/db', () => {
  return {
    db: {
      select: () => ({
        from: (table: unknown) => {
          if (table === activeSession) {
            return {
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
            };
          }

          // Monitoring query builder
          const data = dbQueries.queue[dbQueries.index++] ?? [];
          const queryBuilder = Object.assign(Promise.resolve(data), {
            where: () => {
              // If there was a where, it might consume the data or we can return it.
              // Since some queries in admin.service.ts don't have .where (they are just select.from(table)),
              // we can return a promise.
              return Promise.resolve(data);
            },
          });
          return queryBuilder;
        },
      }),
    },
    schema: { activeSession },
  };
});

import { app } from '@/app';

describe('Admin Monitoring Endpoint', () => {
  beforeEach(() => {
    testState.hasSession = true;
    testState.activeRole = 'admin';
    dbQueries.reset();
  });

  test('returns 401 when no session is active', async () => {
    testState.hasSession = false;
    const res = await app.request('/api/admin/monitoring');
    expect(res.status).toBe(401);
  });

  test('returns 403 when user is not an admin', async () => {
    testState.activeRole = 'buyer';
    const res = await app.request('/api/admin/monitoring');
    expect(res.status).toBe(403);
  });

  test('returns stats correctly when logged in as admin', async () => {
    // We expect 9 queries in order:
    // 1. count users
    dbQueries.push({ count: 10 });
    // 2. count stores
    dbQueries.push({ count: 5 });
    // 3. count products
    dbQueries.push({ count: 20 });
    // 4. count orders
    dbQueries.push({ count: 15 });
    // 5. sum totalAmount
    dbQueries.push({ total: 150000 });
    // 6. count vouchers
    dbQueries.push({ count: 3 });
    // 7. count promos
    dbQueries.push({ count: 2 });
    // 8. count deliveryJobs
    dbQueries.push({ count: 8 });
    // 9. count overdue
    dbQueries.push({ count: 1 });

    const res = await app.request('/api/admin/monitoring');

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toEqual({
      totalUsers: 10,
      totalStores: 5,
      totalProducts: 20,
      totalOrders: 15,
      totalRevenue: 150000,
      totalVouchers: 3,
      totalPromos: 2,
      totalDeliveryJobs: 8,
      totalOverdueOrders: 1,
    });
  });
});
