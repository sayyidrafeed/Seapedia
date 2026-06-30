import { describe, expect, test, mock, beforeEach } from 'bun:test';
import { activeSession, simulationState } from '@/db/schema';

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

mock.module('@/db', () => ({
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
        return {
          where: () => ({
            limit: () => Promise.resolve([]),
          }),
        };
      },
    }),
  },
  schema: { activeSession, simulationState },
}));

import { app } from '@/app';

describe('Overdue Routes', () => {
  beforeEach(() => {
    testState.hasSession = true;
    testState.activeRole = 'admin';
  });

  test('POST /api/admin/simulate-day returns 401 without session', async () => {
    testState.hasSession = false;
    const res = await app.request('/api/admin/simulate-day', { method: 'POST' });
    expect(res.status).toBe(401);
  });

  test('POST /api/admin/overdue/process returns 403 for non-admin', async () => {
    testState.activeRole = 'buyer';
    const res = await app.request('/api/admin/overdue/process', { method: 'POST' });
    expect(res.status).toBe(403);
  });
});
