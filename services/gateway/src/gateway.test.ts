import { describe, expect, test } from 'bun:test';
import { createGateway } from './gateway';
import { createSessionResolver } from './session';

const UPSTREAMS = {
  identity: 'http://identity.test',
  catalog: 'http://catalog.test',
  commerce: 'http://commerce.test',
};

function setup() {
  const forwarded: Request[] = [];
  const sessions = createSessionResolver(
    async (token) =>
      token === 'valid-cookie'
        ? { active: true, userId: 'user-1', sessionId: 'session-1', activeRole: 'seller' }
        : { active: false },
    0,
  );
  const app = createGateway({
    upstreams: UPSTREAMS,
    internalToken: 'internal-token-0000',
    sessions,
    allowedOrigins: ['http://localhost:5173'],
    publicUrl: 'http://localhost:3001',
    timeoutMs: 1000,
    fetch: async (input) => {
      forwarded.push(input as Request);
      return Response.json({ ok: true });
    },
  });
  return { app, forwarded };
}

describe('gateway', () => {
  test('ignores identity headers sent by the client', async () => {
    const { app, forwarded } = setup();
    await app.request('/api/seller/orders', {
      headers: {
        'x-user-id': 'admin-1',
        'x-active-role': 'admin',
        authorization: 'Bearer guessed-token',
      },
    });

    const req = forwarded[0];
    expect(new URL(req.url).origin).toBe(UPSTREAMS.commerce);
    expect(req.headers.get('x-user-id')).toBeNull();
    expect(req.headers.get('x-active-role')).toBeNull();
    expect(req.headers.get('authorization')).toBe('Bearer internal-token-0000');
  });

  test('forwards the identity resolved from the session cookie', async () => {
    const { app, forwarded } = setup();
    await app.request('/api/seller/products?page=2', {
      headers: { cookie: '__session=valid-cookie', 'x-active-role': 'admin' },
    });

    const req = forwarded[0];
    expect(req.url).toBe('http://catalog.test/api/seller/products?page=2');
    expect(req.headers.get('x-user-id')).toBe('user-1');
    expect(req.headers.get('x-session-id')).toBe('session-1');
    expect(req.headers.get('x-active-role')).toBe('seller');
  });

  test('forwards no identity for an invalid or logged-out session', async () => {
    const { app, forwarded } = setup();
    await app.request('/api/auth/me', { headers: { cookie: '__session=stale-cookie' } });

    expect(new URL(forwarded[0].url).origin).toBe(UPSTREAMS.identity);
    expect(forwarded[0].headers.get('x-user-id')).toBeNull();
  });

  test('answers 404 for paths no service owns', async () => {
    const { app, forwarded } = setup();
    const res = await app.request('/api/internal-only');
    expect(res.status).toBe(404);
    expect(forwarded).toHaveLength(0);
  });
});
