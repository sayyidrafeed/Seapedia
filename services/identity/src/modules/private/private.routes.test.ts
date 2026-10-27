import { describe, expect, test, beforeEach } from 'bun:test';

// ─── Mutable test state used by mock factories ───────────────────────────────
const testState = {
  hasSession: true,
  activeRole: '',
};

// Requests carry a real access token signed by identity, verified like in production.
const tokenByRole = Object.fromEntries(
  await Promise.all(
    ['', 'admin', 'seller', 'buyer', 'driver'].map(async (role) => {
      const { token } = await signAccessToken({
        userId: 'test-user',
        sessionId: 'test-session',
        roles: [role],
        activeRole: role,
      });
      return [role, token] as const;
    }),
  ),
);

function identityHeaders(): Record<string, string> {
  if (!testState.hasSession) return {};
  return { cookie: `__access=${tokenByRole[testState.activeRole]}` };
}

// ─── SUT ─────────────────────────────────────────────────────────────────────
import { authenticate } from '@seapedia/platform/auth';
import type { ServiceEnv } from '@seapedia/platform/factory';
import { Hono } from 'hono';
import { signAccessToken } from '@/lib/tokens';
import { runtime } from '@/runtime';
import { privateRouter } from './private.routes';

const ROLES = ['admin', 'seller', 'buyer', 'driver'] as const;

function createTestApp() {
  const app = new Hono<ServiceEnv>();
  app.use('*', authenticate(runtime.verifier, runtime.denylist));
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

  test('returns 401 without an access token', async () => {
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
