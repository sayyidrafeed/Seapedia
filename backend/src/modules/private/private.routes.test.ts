import { describe, expect, test, mock, beforeEach } from 'bun:test';

// ─── Mutable test state used by mock factories ───────────────────────────────
const testState = {
  hasSession: true,
  activeRole: '',
};

// ─── Mock dependencies ───────────────────────────────────────────────────────
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
      transaction: (fn: (tx: unknown) => unknown) => {
        const tx = {
          select: makeSelect(),
          insert: () => ({ values: () => ({ returning: () => Promise.resolve([]) }) }),
        };
        return fn(tx);
      },
    },
    schema: {},
  };
});

// ─── SUT ─────────────────────────────────────────────────────────────────────
import { Hono } from 'hono';
import { privateRouter } from './private.routes';

const ROLES = ['admin', 'seller', 'buyer', 'driver'] as const;

function createTestApp() {
  const app = new Hono();
  app.route('/api/private', privateRouter);
  return app;
}

type Role = (typeof ROLES)[number];

// ─── Tests ───────────────────────────────────────────────────────────────────
describe('Private endpoints authorization', () => {
  beforeEach(() => {
    testState.hasSession = true;
    testState.activeRole = '';
  });

  test('returns 401 when no session cookie is provided', async () => {
    testState.hasSession = false;
    const app = createTestApp();
    const res = await app.request('/api/private/seller');

    expect(res.status).toBe(401);
    const text = await res.text();
    expect(text).toContain('Unauthorized');
  });

  test('returns 403 when active role does not match endpoint requirement', async () => {
    testState.activeRole = 'buyer';
    const app = createTestApp();
    const res = await app.request('/api/private/seller');

    expect(res.status).toBe(403);
    const text = await res.text();
    expect(text).toContain("Forbidden: Requires role 'seller'");
  });
});

describe('Private endpoints per role', () => {
  beforeEach(() => {
    testState.hasSession = true;
  });

  for (const role of ROLES) {
    const display = role.charAt(0).toUpperCase() + role.slice(1);
    test(`returns 200 for ${role} endpoint when activeRole is ${role}`, async () => {
      testState.activeRole = role;
      const app = createTestApp();
      const res = await app.request(`/api/private/${role}`);

      expect(res.status).toBe(200);
      const body = (await res.json()) as { message: string; activeRole: string };
      expect(body.message).toBe(
        `This endpoint can only be used by users with the ${display} role.`,
      );
      expect(body.activeRole).toBe(role);
    });
  }

  const mismatches: [Role, Role][] = [
    ['seller', 'admin'],
    ['seller', 'buyer'],
    ['seller', 'driver'],
    ['buyer', 'admin'],
    ['buyer', 'seller'],
    ['buyer', 'driver'],
    ['driver', 'admin'],
    ['driver', 'seller'],
    ['driver', 'buyer'],
    ['admin', 'seller'],
    ['admin', 'buyer'],
    ['admin', 'driver'],
  ];

  for (const [endpointRole, wrongRole] of mismatches) {
    test(`returns 403 for ${endpointRole} endpoint when activeRole is ${wrongRole}`, async () => {
      testState.activeRole = wrongRole;
      const app = createTestApp();
      const res = await app.request(`/api/private/${endpointRole}`);

      expect(res.status).toBe(403);
      const text = await res.text();
      expect(text).toContain(`Forbidden: Requires role '${endpointRole}'`);
    });
  }
});
