import { db } from '@/db';
import { userRole, users } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { NotFoundError } from '@seapedia/platform/errors';
import { StorageService } from '@/lib/storage';
import { IdentityEvents, identityOutbox } from '@/modules/events/events.index';

export class UsersService {
  /**
   * Generates presigned URL for user avatar
   */
  static async presignAvatar(userId: string, mimeType: string) {
    // Verify user exists
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    return await StorageService.generatePresignedUpload('users/avatars', mimeType);
  }

  /**
   * Updates user profile (name and/or avatarKey)
   */
  static async updateProfile(userId: string, input: { name?: string; avatarKey?: string | null }) {
    // 1. Get existing user
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const oldAvatarKey = user.avatarKey;

    // 2. Perform DB update; the display name is replicated by other services, so publish it.
    const updatedUser = await db.transaction(async (tx) => {
      const [updated] = await tx
        .update(users)
        .set({
          name: input.name !== undefined ? input.name : user.name,
          avatarKey: input.avatarKey !== undefined ? input.avatarKey : user.avatarKey,
          updatedAt: new Date(),
          version: sql`${users.version} + 1`,
        })
        .where(eq(users.id, userId))
        .returning();
      const roles = await tx
        .select({ role: userRole.role })
        .from(userRole)
        .where(eq(userRole.userId, userId));
      await identityOutbox.enqueue(
        tx,
        IdentityEvents.user(
          'updated',
          updated,
          roles.map((r) => r.role),
        ),
      );
      return updated;
    });

    // 3. Delete old avatar from R2 if it changed and DB update succeeded
    if (input.avatarKey !== undefined && oldAvatarKey && oldAvatarKey !== input.avatarKey) {
      // Run deletion asynchronously in background or wait, but the rule says:
      // "Never delete the old object before the database update succeeds."
      // Since DB update succeeded here (we got updatedUser), we can safe delete.
      await StorageService.deleteObject(oldAvatarKey);
    }

    return updatedUser;
  }
}
