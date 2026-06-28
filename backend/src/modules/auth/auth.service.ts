import { db } from '@/db';
import { users, userRole, activeSession } from '@/db/schema';
import { eq, or, and } from 'drizzle-orm';
import { ConflictError, ValidationError, ForbiddenError, NotFoundError } from '@/lib/errors';

export class AuthService {
  static async register(input: {
    username: string;
    email: string;
    password: string;
    name?: string;
  }) {
    // Check uniqueness
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
      // Create user
      const [newUser] = await tx
        .insert(users)
        .values({
          username: input.username,
          email: input.email,
          passwordHash,
          name: input.name || null,
        })
        .returning();

      // Assign default 'buyer' role
      await tx.insert(userRole).values({
        userId: newUser.id,
        role: 'buyer',
      });

      // Create active session with 'buyer' role
      const [session] = await tx
        .insert(activeSession)
        .values({
          userId: newUser.id,
          activeRole: 'buyer',
        })
        .returning();

      return { user: newUser, session };
    });
  }

  static async login(input: { username: string; password: string }) {
    // Find user by username or email
    const [user] = await db
      .select()
      .from(users)
      .where(or(eq(users.username, input.username), eq(users.email, input.username)))
      .limit(1);

    if (!user) {
      throw new ValidationError('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await Bun.password.verify(input.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new ValidationError('Invalid credentials');
    }

    // Get user roles
    const roles = await db.select().from(userRole).where(eq(userRole.userId, user.id));
    if (roles.length === 0) {
      // Assign default buyer if none exists (fallback)
      await db.insert(userRole).values({
        userId: user.id,
        role: 'buyer',
      });
      roles.push({
        id: crypto.randomUUID(),
        userId: user.id,
        role: 'buyer',
        createdAt: new Date(),
      });
    }

    const roleStrings = roles.map((r) => r.role);

    // Upsert session
    const [existingSession] = await db
      .select()
      .from(activeSession)
      .where(eq(activeSession.userId, user.id))
      .limit(1);

    let session = existingSession;
    if (session) {
      if (!roleStrings.includes(session.activeRole)) {
        const [updatedSession] = await db
          .update(activeSession)
          .set({ activeRole: roleStrings[0], updatedAt: new Date() })
          .where(eq(activeSession.id, session.id))
          .returning();
        session = updatedSession;
      }
    } else {
      const [newSession] = await db
        .insert(activeSession)
        .values({
          userId: user.id,
          activeRole: roleStrings[0],
        })
        .returning();
      session = newSession;
    }

    return { user, session, roles: roleStrings };
  }

  static async logout(sessionId: string) {
    await db.delete(activeSession).where(eq(activeSession.id, sessionId));
  }

  static async selectRole(userId: string, sessionId: string, role: string) {
    // Verify user owns the role
    const roles = await db
      .select()
      .from(userRole)
      .where(and(eq(userRole.userId, userId), eq(userRole.role, role)))
      .limit(1);

    if (roles.length === 0) {
      throw new ForbiddenError(`You do not have access to the '${role}' role`);
    }

    // Update session active role
    const [updatedSession] = await db
      .update(activeSession)
      .set({ activeRole: role, updatedAt: new Date() })
      .where(eq(activeSession.id, sessionId))
      .returning();

    if (!updatedSession) {
      throw new NotFoundError('Session not found');
    }

    return updatedSession;
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
      .from(activeSession)
      .where(eq(activeSession.id, sessionId))
      .limit(1);

    if (!session) {
      throw new NotFoundError('Session not found');
    }

    const roles = await db.select().from(userRole).where(eq(userRole.userId, userId));
    return {
      userId,
      activeRole: session.activeRole,
      roles: roles.map((r) => r.role),
    };
  }

  static async onboard(userId: string, selectedRoles: ('buyer' | 'seller' | 'driver')[]) {
    const uniqueRoles = Array.from(new Set(['buyer', ...selectedRoles]));

    return await db.transaction(async (tx) => {
      // Clear roles first
      await tx.delete(userRole).where(eq(userRole.userId, userId));

      // Re-insert
      for (const role of uniqueRoles) {
        await tx.insert(userRole).values({
          userId,
          role,
        });
      }

      // Update users
      await tx
        .update(users)
        .set({ isOnboarded: true, updatedAt: new Date() })
        .where(eq(users.id, userId));
    });
  }

  static async getFinancialSummary(userId: string) {
    const roles = await db.select().from(userRole).where(eq(userRole.userId, userId));
    const roleStrings = roles.map((r) => r.role);

    return {
      buyer: roleStrings.includes('buyer') ? { balance: 0 } : undefined,
      seller: roleStrings.includes('seller') ? { income: 0 } : undefined,
      driver: roleStrings.includes('driver') ? { earnings: 0 } : undefined,
    };
  }
}


