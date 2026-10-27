import { beforeEach, describe, expect, mock, test } from 'bun:test';
import { createTokenVerifier } from '@seapedia/platform/auth';
import type { EventEnvelope } from '@seapedia/platform/events';
import { getTableName, type Table } from 'drizzle-orm';

// ─── Database fake: every query chain resolves to the next queued result ─────
const dbState = {
  selects: [] as unknown[][],
  inserts: [] as { table: string; values: unknown }[],
  insertResults: [] as unknown[][],
  updates: [] as { table: string; values: unknown }[],
  updateResults: [] as unknown[][],
  reset() {
    this.selects = [];
    this.inserts = [];
    this.insertResults = [];
    this.updates = [];
    this.updateResults = [];
  },
};

function chain(result: () => unknown, onValues?: (values: unknown) => void): unknown {
  const proxy: unknown = new Proxy(() => undefined, {
    get(_t, prop) {
      if (prop === 'then') {
        return (res: (v: unknown) => void, rej: (e: unknown) => void) =>
          Promise.resolve(result()).then(res, rej);
      }
      return (...args: unknown[]) => {
        if ((prop === 'values' || prop === 'set') && onValues) onValues(args[0]);
        return proxy;
      };
    },
  });
  return proxy;
}

const db = {
  select: () => chain(() => dbState.selects.shift() ?? []),
  insert: (table: Table) => {
    const entry = { table: getTableName(table), values: undefined as unknown };
    dbState.inserts.push(entry);
    return chain(
      () => dbState.insertResults.shift() ?? [],
      (v) => (entry.values = v),
    );
  },
  update: (table: Table) => {
    const entry = { table: getTableName(table), values: undefined as unknown };
    dbState.updates.push(entry);
    return chain(
      () => dbState.updateResults.shift() ?? [],
      (v) => (entry.values = v),
    );
  },
  delete: () => chain(() => []),
  transaction: (fn: (tx: unknown) => unknown) => fn(db),
};

mock.module('@/db', () => ({ db }));

// The real outbox writes into the fake database; events are read back from the outbox rows.
const published = () =>
  dbState.inserts
    .filter((i) => i.table === 'outbox')
    .flatMap((i) => (i.values as { payload: EventEnvelope }[]).map((row) => row.payload));

import { AuthService } from './auth.service';

const verifier = createTokenVerifier(process.env.JWT_PUBLIC_KEY!);
const user = {
  id: '00000000-0000-4000-8000-000000000001',
  username: 'dewi',
  email: 'dewi@example.com',
  name: 'Dewi',
  passwordHash: await Bun.password.hash('password123', 'bcrypt'),
  isOnboarded: true,
  avatarKey: null,
  version: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
};
const SESSION = '00000000-0000-4000-8000-0000000000aa';

beforeEach(() => {
  dbState.reset();
});

describe('register and login', () => {
  test('register refuses a taken username or email', async () => {
    dbState.selects.push([user]);
    await expect(
      AuthService.register({ username: 'dewi', email: 'x@example.com', password: 'secret123' }),
    ).rejects.toThrow('Username or email is already taken');
  });

  test('register creates a buyer session and announces the new user', async () => {
    dbState.selects.push([]); // uniqueness check
    dbState.insertResults.push([user], [], [{ id: SESSION }]); // user, role, session

    const { tokens } = await AuthService.register({
      username: 'dewi',
      email: 'dewi@example.com',
      password: 'password123',
    });

    expect(tokens.refreshToken).toBeDefined();
    const claims = await verifier.user(tokens.accessToken);
    expect(claims).toMatchObject({ userId: user.id, sessionId: SESSION, activeRole: 'buyer' });
    expect(published().map((e) => e.type)).toEqual(['identity.user.registered']);
  });

  test('login rejects a wrong password', async () => {
    dbState.selects.push([user]);
    await expect(AuthService.login({ username: 'dewi', password: 'wrong' })).rejects.toThrow(
      'Invalid credentials',
    );
  });

  test('each login opens its own session, so devices sign out independently', async () => {
    dbState.selects.push([user], [{ role: 'buyer' }, { role: 'seller' }]);
    dbState.insertResults.push([{ id: SESSION }]);

    const { tokens } = await AuthService.login({ username: 'dewi', password: 'password123' });

    expect(dbState.inserts.map((i) => i.table)).toEqual(['sessions', 'refresh_tokens']);
    expect(await verifier.user(tokens.accessToken)).toMatchObject({
      roles: ['buyer', 'seller'],
      activeRole: 'buyer',
    });
  });
});

describe('refresh token rotation', () => {
  const stored = (usedAt: Date | null) => ({
    id: 'rt-1',
    sessionId: SESSION,
    expiresAt: new Date(Date.now() + 86_400_000),
    usedAt,
    revokedAt: null,
    userId: user.id,
    activeRole: 'seller',
  });

  test('a fresh token is rotated: marked used, and a new pair issued', async () => {
    dbState.selects.push([stored(null)], [{ role: 'buyer' }, { role: 'seller' }]);

    const result = await AuthService.refresh('presented-token');

    expect(result.reused).toBe(false);
    if (result.reused) return;
    expect(dbState.updates[0]).toMatchObject({ table: 'refresh_tokens' });
    expect(dbState.inserts.map((i) => i.table)).toEqual(['refresh_tokens']);
    expect(await verifier.user(result.tokens.accessToken)).toMatchObject({ activeRole: 'seller' });
  });

  test('a token used twice revokes the session and tells every service', async () => {
    dbState.selects.push([stored(new Date())]);
    dbState.updateResults.push([{ id: SESSION }]); // session revoked

    const result = await AuthService.refresh('replayed-token');

    expect(result.reused).toBe(true);
    expect(dbState.updates[0]).toMatchObject({ table: 'sessions' });
    expect(published().map((e) => e.type)).toEqual(['identity.session.revoked']);
    expect(published()[0].data).toMatchObject({ sessionId: SESSION });
  });

  test('an unknown token is refused', async () => {
    dbState.selects.push([]);
    await expect(AuthService.refresh('nope')).rejects.toThrow('Session expired');
  });
});

describe('roles', () => {
  test('a role the user does not hold cannot be selected', async () => {
    dbState.selects.push([{ role: 'buyer' }]);
    await expect(AuthService.selectRole(user.id, SESSION, 'admin')).rejects.toThrow(
      "You do not have access to the 'admin' role",
    );
  });

  test('switching role re-issues the access token with the new role', async () => {
    dbState.selects.push([{ role: 'buyer' }, { role: 'seller' }]);
    dbState.updateResults.push([{ id: SESSION }]);

    const tokens = await AuthService.selectRole(user.id, SESSION, 'seller');

    expect(await verifier.user(tokens.accessToken)).toMatchObject({ activeRole: 'seller' });
  });

  test('onboarding twice is refused', async () => {
    dbState.selects.push([{ ...user, isOnboarded: true }]);
    await expect(AuthService.onboard(user.id, SESSION, ['seller'])).rejects.toThrow(
      'User is already onboarded',
    );
  });
});
