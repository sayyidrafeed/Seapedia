import { createHash, randomBytes } from 'node:crypto';
import { and, eq, isNull, ne, or, sql } from 'drizzle-orm';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from '@seapedia/platform/errors';
import { config } from '@/config';
import { db } from '@/db';
import { refreshTokens, sessions, userRole, users } from '@/db/schema';
import { signAccessToken } from '@/lib/tokens';
import { IdentityEvents, identityOutbox } from '@/modules/events/events.index';

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

// Tokens handed to the browser after login, register, refresh, or a role change.
export type IssuedTokens = {
  accessToken: string;
  accessTtl: number;
  refreshToken?: string;
  refreshTtl?: number;
};

async function rolesOf(executor: Pick<Tx, 'select'>, userId: string) {
  const rows = await executor
    .select({ role: userRole.role })
    .from(userRole)
    .where(eq(userRole.userId, userId));
  return rows.map((r) => r.role);
}

async function newRefreshToken(tx: Tx, sessionId: string) {
  const token = randomBytes(32).toString('base64url');
  const ttlDays = config.get().refreshTokenTtlDays;
  await tx.insert(refreshTokens).values({
    sessionId,
    tokenHash: hashToken(token),
    expiresAt: new Date(Date.now() + ttlDays * 86_400_000),
  });
  return { refreshToken: token, refreshTtl: ttlDays * 86_400 };
}

async function accessFor(userId: string, sessionId: string, roles: string[], activeRole: string) {
  const access = await signAccessToken({ userId, sessionId, roles, activeRole });
  return { accessToken: access.token, accessTtl: access.ttl };
}

// The longest an access token issued now could still be accepted.
const accessHorizon = () => Math.floor(Date.now() / 1000) + config.get().accessTokenTtlSeconds;

export class AuthService {
  static async register(input: {
    username: string;
    email: string;
    password: string;
    name?: string;
  }) {
    const existing = await db
      .select()
      .from(users)
      .where(or(eq(users.username, input.username), eq(users.email, input.email)))
      .limit(1);

    if (existing.length > 0) {
      throw new ConflictError('Username or email is already taken');
    }

    // Hash password using Bun's native bcrypt
    const passwordHash = await Bun.password.hash(input.password, 'bcrypt');

    return await db.transaction(async (tx) => {
      const [newUser] = await tx
        .insert(users)
        .values({
          username: input.username,
          email: input.email,
          passwordHash,
          name: input.name || null,
        })
        .returning();

      // Every account starts as a buyer.
      await tx.insert(userRole).values({ userId: newUser.id, role: 'buyer' });
      const [session] = await tx
        .insert(sessions)
        .values({ userId: newUser.id, activeRole: 'buyer' })
        .returning();

      await identityOutbox.enqueue(tx, IdentityEvents.user('registered', newUser, ['buyer']));
      const refresh = await newRefreshToken(tx, session.id);
      const tokens: IssuedTokens = {
        ...(await accessFor(newUser.id, session.id, ['buyer'], 'buyer')),
        ...refresh,
      };
      return { user: newUser, session, tokens };
    });
  }

  // Signs in on a new device: a separate session, so logging out elsewhere does not affect it.
  static async login(input: { username: string; password: string }) {
    const [user] = await db
      .select()
      .from(users)
      .where(or(eq(users.username, input.username), eq(users.email, input.username)))
      .limit(1);

    if (!user) {
      throw new ValidationError('Invalid credentials');
    }

    const isPasswordValid = await Bun.password.verify(input.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new ValidationError('Invalid credentials');
    }

    return await db.transaction(async (tx) => {
      let roles = await rolesOf(tx, user.id);
      if (roles.length === 0) {
        // Assign default buyer if none exists (fallback)
        await tx.insert(userRole).values({ userId: user.id, role: 'buyer' });
        roles = ['buyer'];
      }

      const [session] = await tx
        .insert(sessions)
        .values({ userId: user.id, activeRole: roles[0] })
        .returning();
      const refresh = await newRefreshToken(tx, session.id);
      const tokens: IssuedTokens = {
        ...(await accessFor(user.id, session.id, roles, roles[0])),
        ...refresh,
      };
      return { user, session, roles, tokens };
    });
  }

  static async refresh(presented: string) {
    return await db.transaction(async (tx) => {
      const [row] = await tx
        .select({
          id: refreshTokens.id,
          sessionId: refreshTokens.sessionId,
          expiresAt: refreshTokens.expiresAt,
          usedAt: refreshTokens.usedAt,
          revokedAt: sessions.revokedAt,
          userId: sessions.userId,
          activeRole: sessions.activeRole,
        })
        .from(refreshTokens)
        .innerJoin(sessions, eq(sessions.id, refreshTokens.sessionId))
        .where(eq(refreshTokens.tokenHash, hashToken(presented)))
        .for('update')
        .limit(1);

      if (!row || row.revokedAt || row.expiresAt <= new Date()) {
        throw new UnauthorizedError('Session expired');
      }

      if (row.usedAt) {
        await AuthService.revokeSession(tx, row.sessionId);
        return { reused: true as const };
      }

      await tx
        .update(refreshTokens)
        .set({ usedAt: new Date() })
        .where(eq(refreshTokens.id, row.id));
      await tx
        .update(sessions)
        .set({ lastUsedAt: new Date() })
        .where(eq(sessions.id, row.sessionId));

      const roles = await rolesOf(tx, row.userId);
      const activeRole = roles.includes(row.activeRole) ? row.activeRole : roles[0];
      const refresh = await newRefreshToken(tx, row.sessionId);
      const tokens: IssuedTokens = {
        ...(await accessFor(row.userId, row.sessionId, roles, activeRole)),
        ...refresh,
      };
      return { reused: false as const, tokens };
    });
  }

  // Ends a session, by its id (from the access token) or by its refresh token.
  static async logout(by: { sessionId?: string; refreshToken?: string }) {
    await db.transaction(async (tx) => {
      let sessionId = by.sessionId;
      if (!sessionId && by.refreshToken) {
        const [row] = await tx
          .select({ sessionId: refreshTokens.sessionId })
          .from(refreshTokens)
          .where(eq(refreshTokens.tokenHash, hashToken(by.refreshToken)))
          .limit(1);
        sessionId = row?.sessionId;
      }
      if (sessionId) await AuthService.revokeSession(tx, sessionId);
    });
  }

  static async revokeSession(tx: Tx, sessionId: string) {
    const revoked = await tx
      .update(sessions)
      .set({ revokedAt: new Date() })
      .where(and(eq(sessions.id, sessionId), isNull(sessions.revokedAt)))
      .returning({ id: sessions.id });
    if (revoked.length > 0) {
      await identityOutbox.enqueue(tx, IdentityEvents.sessionRevoked(sessionId, accessHorizon()));
    }
  }

  // Switches the session's active role and re-issues the access token that carries it.
  static async selectRole(userId: string, sessionId: string, role: string) {
    const roles = await rolesOf(db, userId);
    if (!roles.includes(role)) {
      throw new ForbiddenError(`You do not have access to the '${role}' role`);
    }

    const [updatedSession] = await db
      .update(sessions)
      .set({ activeRole: role, lastUsedAt: new Date() })
      .where(and(eq(sessions.id, sessionId), isNull(sessions.revokedAt)))
      .returning();

    if (!updatedSession) {
      throw new NotFoundError('Session not found');
    }

    return await accessFor(userId, sessionId, roles, role);
  }

  static async getUser(userId: string) {
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    return user;
  }

  static async getSessionInfo(userId: string, sessionId: string) {
    const [session] = await db
      .select()
      .from(sessions)
      .where(and(eq(sessions.id, sessionId), isNull(sessions.revokedAt)))
      .limit(1);

    if (!session) {
      throw new NotFoundError('Session not found');
    }

    return { userId, activeRole: session.activeRole, roles: await rolesOf(db, userId) };
  }

  // Sets the user's roles; the caller's access token is re-issued with them.
  static async onboard(
    userId: string,
    sessionId: string,
    selectedRoles: ('buyer' | 'seller' | 'driver')[],
  ) {
    const uniqueRoles = Array.from(new Set(['buyer', ...selectedRoles]));

    const roles = await db.transaction(async (tx) => {
      const [user] = await tx.select().from(users).where(eq(users.id, userId)).limit(1);

      if (!user) {
        throw new NotFoundError('User not found');
      }

      if (user.isOnboarded) {
        throw new ForbiddenError('User is already onboarded');
      }

      // Clear roles first, but protect the 'admin' role if present
      await tx.delete(userRole).where(and(eq(userRole.userId, userId), ne(userRole.role, 'admin')));

      for (const role of uniqueRoles) {
        if (role === 'admin') continue;
        await tx.insert(userRole).values({ userId, role });
      }

      const [updated] = await tx
        .update(users)
        .set({ isOnboarded: true, updatedAt: new Date(), version: sql`${users.version} + 1` })
        .where(eq(users.id, userId))
        .returning();

      const current = await rolesOf(tx, userId);
      await identityOutbox.enqueue(tx, IdentityEvents.user('updated', updated, current));
      return current;
    });

    const [session] = await db.select().from(sessions).where(eq(sessions.id, sessionId)).limit(1);
    const activeRole =
      session && roles.includes(session.activeRole) ? session.activeRole : roles[0];
    return await accessFor(userId, sessionId, roles, activeRole);
  }

  static async getFinancialSummary(userId: string) {
    const roleStrings = await rolesOf(db, userId);

    return {
      buyer: roleStrings.includes('buyer') ? { balance: 0 } : undefined,
      seller: roleStrings.includes('seller') ? { income: 0 } : undefined,
      driver: roleStrings.includes('driver') ? { earnings: 0 } : undefined,
    };
  }
}
