import { describe, expect, test, beforeEach } from 'bun:test';

// ─── Mutable test state used by mock factories ───────────────────────────────
const testState = {
  hasSession: true,
  activeRole: '',
};

// The gateway resolves the session and forwards identity headers; services only read them.
function identityHeaders(): Record<string, string> {
  if (!testState.hasSession) return {};
  return {
    'x-user-id': 'test-user',
    'x-session-id': 'test-session',
    'x-active-role': testState.activeRole,
  };
}

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

  test('returns 401 when the gateway forwarded no session', async () => {
    testState.hasSession = false;
    const app = createTestApp();
    const res = await app.request('/api/private/seller', { headers: identityHeaders() });

    expect(res.status).toBe(401);
    const text = await res.text();
    expect(text).toContain('Unauthorized');
  });

  test('returns 403 when active role does not match endpoint requirement', async () => {
    testState.activeRole = 'buyer';
    const app = createTestApp();
    const res = await app.request('/api/private/seller', { headers: identityHeaders() });

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
      const res = await app.request(`/api/private/${role}`, { headers: identityHeaders() });

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
      const res = await app.request(`/api/private/${endpointRole}`, {
        headers: identityHeaders(),
      });

      expect(res.status).toBe(403);
      const text = await res.text();
      expect(text).toContain(`Forbidden: Requires role '${endpointRole}'`);
    });
  }
});
