import { describe, expect, test } from 'bun:test';
import { Hono } from 'hono';
import { exportSPKI, generateKeyPair, SignJWT } from 'jose';
import type { ServiceEnv } from '../factory';
import { createSessionDenylist } from './denylist';
import { authenticate, requireServiceScope, requireSession } from './middleware';
import { API_AUDIENCE, createTokenVerifier, ISSUER } from './tokens';

const { privateKey, publicKey } = await generateKeyPair('RS256');
const verifier = createTokenVerifier(await exportSPKI(publicKey));

function sign(claims: Record<string, unknown>, audience: string, expiresIn = '10m') {
  return new SignJWT(claims)
    .setProtectedHeader({ alg: 'RS256' })
    .setIssuer(ISSUER)
    .setAudience(audience)
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(privateKey);
}

const accessClaims = {
  sub: 'user-1',
  sid: 'session-1',
  roles: ['buyer'],
  role: 'buyer',
  token_use: 'access',
};

function app() {
  const denylist = createSessionDenylist();
  const a = new Hono<ServiceEnv>();
  a.use('*', authenticate(verifier, denylist));
  a.get('/me', requireSession, (c) => c.json({ userId: c.get('userId') }));
  a.get('/internal/search', requireServiceScope(verifier, 'search', 'search:query'), (c) =>
    c.json({ caller: c.get('serviceClient') }),
  );
  return { a, denylist };
}

const asCookie = (token: string) => ({ headers: { cookie: `__access=${token}` } });

describe('user access tokens', () => {
  test('a valid access token identifies the user', async () => {
    const res = await app().a.request('/me', asCookie(await sign(accessClaims, API_AUDIENCE)));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ userId: 'user-1' });
  });

  test('a token for another audience is not a user session', async () => {
    const res = await app().a.request('/me', asCookie(await sign(accessClaims, 'search')));
    expect(res.status).toBe(401);
  });

  test('an expired token is rejected', async () => {
    const res = await app().a.request(
      '/me',
      asCookie(await sign(accessClaims, API_AUDIENCE, '-1m')),
    );
    expect(res.status).toBe(401);
  });

  test('a revoked session is rejected before its token expires', async () => {
    const { a, denylist } = app();
    denylist.revoke('session-1', Date.now() / 1000 + 600);
    const res = await a.request('/me', asCookie(await sign(accessClaims, API_AUDIENCE)));
    expect(res.status).toBe(401);
  });

  test('a service token cannot be used as a user session', async () => {
    const token = await sign(
      { sub: 'catalog', scope: 'search:query', token_use: 'service' },
      API_AUDIENCE,
    );
    expect((await app().a.request('/me', asCookie(token))).status).toBe(401);
  });
});

describe('service tokens', () => {
  const bearer = (token: string) => ({ headers: { authorization: `Bearer ${token}` } });

  test('the right audience and scope pass', async () => {
    const token = await sign(
      { sub: 'catalog', scope: 'search:query', token_use: 'service' },
      'search',
    );
    const res = await app().a.request('/internal/search', bearer(token));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ caller: 'catalog' });
  });

  test('a missing scope is forbidden', async () => {
    const token = await sign(
      { sub: 'catalog', scope: 'search:reindex', token_use: 'service' },
      'search',
    );
    expect((await app().a.request('/internal/search', bearer(token))).status).toBe(403);
  });

  test('a user access token is not a service token', async () => {
    const token = await sign(accessClaims, 'search');
    expect((await app().a.request('/internal/search', bearer(token))).status).toBe(401);
  });
});
