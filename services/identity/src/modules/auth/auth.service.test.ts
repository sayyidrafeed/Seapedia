import { describe, expect, test } from 'bun:test';
import { createHash } from 'node:crypto';
import { createTokenVerifier } from '@seapedia/platform/auth';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { refreshTokens, sessions, userRole, users } from '@/db/schema';
import { outboxEvents } from '../../../test/db';
import { AuthService } from './auth.service';

const verifier = createTokenVerifier(process.env.JWT_PUBLIC_KEY!);
const passwordHash = await Bun.password.hash('password123', 'bcrypt');

async function seedUser(roles: string[], fields: Partial<typeof users.$inferInsert> = {}) {
  const [user] = await db
    .insert(users)
    .values({ username: 'dewi', email: 'dewi@example.com', passwordHash, ...fields })
    .returning();
  for (const role of roles) await db.insert(userRole).values({ userId: user.id, role });
  return user;
}

async function signIn(roles = ['buyer', 'seller']) {
  const user = await seedUser(roles);
  const { session, tokens } = await AuthService.login({
    username: 'dewi',
    password: 'password123',
  });
  return { user, session, refreshToken: tokens.refreshToken! };
}

const tokenRow = async (token: string) => {
  const hash = createHash('sha256').update(token).digest('hex');
  const [row] = await db.select().from(refreshTokens).where(eq(refreshTokens.tokenHash, hash));
  return row;
};

describe('register and login', () => {
  test('register refuses a taken username or email', async () => {
    await seedUser(['buyer']);
    await expect(
      AuthService.register({ username: 'dewi', email: 'x@example.com', password: 'secret123' }),
    ).rejects.toThrow('Username or email is already taken');
    await expect(
      AuthService.register({ username: 'other', email: 'dewi@example.com', password: 'secret123' }),
    ).rejects.toThrow('Username or email is already taken');
  });

  test('register creates a buyer session and announces the new user', async () => {
    const { user, session, tokens } = await AuthService.register({
      username: 'dewi',
      email: 'dewi@example.com',
      password: 'password123',
    });

    const claims = await verifier.user(tokens.accessToken);
    expect(claims).toMatchObject({ userId: user.id, sessionId: session.id, activeRole: 'buyer' });
    expect(await db.select({ role: userRole.role }).from(userRole)).toEqual([{ role: 'buyer' }]);
    // Only the hash is stored, so a database leak does not leak usable refresh tokens.
    expect((await tokenRow(tokens.refreshToken!)).sessionId).toBe(session.id);
    const [registered] = await outboxEvents();
    expect(registered).toMatchObject({
      type: 'identity.user.registered',
      version: 1,
      data: { id: user.id, username: 'dewi', roles: ['buyer'] },
    });
  });

  test('login rejects a wrong password', async () => {
    await seedUser(['buyer']);
    await expect(AuthService.login({ username: 'dewi', password: 'wrong' })).rejects.toThrow(
      'Invalid credentials',
    );
  });

  test('each login opens its own session, so devices sign out independently', async () => {
    await seedUser(['buyer', 'seller']);
    const first = await AuthService.login({ username: 'dewi', password: 'password123' });
    const second = await AuthService.login({
      username: 'dewi@example.com',
      password: 'password123',
    });

    expect(first.session.id).not.toBe(second.session.id);
    expect(await verifier.user(second.tokens.accessToken)).toMatchObject({
      roles: ['buyer', 'seller'],
      activeRole: 'buyer',
    });
    await AuthService.logout({ sessionId: first.session.id });
    const live = await db.select({ id: sessions.id, revokedAt: sessions.revokedAt }).from(sessions);
    expect(live).toContainEqual({ id: second.session.id, revokedAt: null });
  });
});

describe('refresh token rotation', () => {
  test('a fresh token is rotated: marked used and linked to the new one', async () => {
    const { user, session, refreshToken } = await signIn();
    await AuthService.selectRole(user.id, session.id, 'seller');

    const result = await AuthService.refresh(refreshToken);

    if (result.reused) throw new Error('expected a rotation');
    const old = await tokenRow(refreshToken);
    const next = await tokenRow(result.tokens.refreshToken!);
    expect(old.usedAt).toBeInstanceOf(Date);
    expect(old.replacedBy).toBe(next.id);
    expect(next).toMatchObject({ sessionId: session.id, usedAt: null });
    expect(await verifier.user(result.tokens.accessToken)).toMatchObject({ activeRole: 'seller' });
  });

  test('a token used twice revokes the session and tells every service', async () => {
    const { session, refreshToken } = await signIn();
    const rotated = await AuthService.refresh(refreshToken);
    if (rotated.reused) throw new Error('expected a rotation');

    expect(await AuthService.refresh(refreshToken)).toEqual({ reused: true });

    const [row] = await db.select().from(sessions).where(eq(sessions.id, session.id));
    expect(row.revokedAt).toBeInstanceOf(Date);
    const revoked = (await outboxEvents()).filter((e) => e.type === 'identity.session.revoked');
    expect(revoked.map((e) => e.data)).toEqual([
      { sessionId: session.id, expiresAt: expect.any(Number) },
    ]);
    // The legitimate holder's newer token belongs to the same family and dies with it.
    await expect(AuthService.refresh(rotated.tokens.refreshToken!)).rejects.toThrow(
      'Session expired',
    );
  });

  test('an unknown or expired token is refused', async () => {
    const { refreshToken } = await signIn();
    await expect(AuthService.refresh('nope')).rejects.toThrow('Session expired');

    await db.update(refreshTokens).set({ expiresAt: new Date(Date.now() - 1000) });
    await expect(AuthService.refresh(refreshToken)).rejects.toThrow('Session expired');
  });
});

describe('roles', () => {
  test('a role the user does not hold cannot be selected', async () => {
    const { user, session } = await signIn(['buyer']);
    await expect(AuthService.selectRole(user.id, session.id, 'admin')).rejects.toThrow(
      "You do not have access to the 'admin' role",
    );
  });

  test('switching role re-issues the access token and remembers it on the session', async () => {
    const { user, session } = await signIn();

    const tokens = await AuthService.selectRole(user.id, session.id, 'seller');

    expect(await verifier.user(tokens.accessToken)).toMatchObject({ activeRole: 'seller' });
    const [row] = await db.select().from(sessions).where(eq(sessions.id, session.id));
    expect(row.activeRole).toBe('seller');
  });

  test('onboarding sets the chosen roles, keeps admin, and publishes a newer version', async () => {
    const user = await seedUser(['admin', 'buyer'], { isOnboarded: false });
    const [session] = await db
      .insert(sessions)
      .values({ userId: user.id, activeRole: 'admin' })
      .returning();

    const tokens = await AuthService.onboard(user.id, session.id, ['driver']);

    expect(await verifier.user(tokens.accessToken)).toMatchObject({ activeRole: 'admin' });
    const roles = await db.select({ role: userRole.role }).from(userRole);
    expect(roles.map((r) => r.role).sort()).toEqual(['admin', 'buyer', 'driver']);
    const [updated] = await outboxEvents();
    expect(updated).toMatchObject({ type: 'identity.user.updated', version: 2 });
    await expect(AuthService.onboard(user.id, session.id, ['seller'])).rejects.toThrow(
      'User is already onboarded',
    );
  });
});
