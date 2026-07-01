import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { NotFoundError } from '@/lib/errors';
import { StorageService } from '@/lib/storage';

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

    // 2. Perform DB update
    const [updatedUser] = await db
      .update(users)
      .set({
        name: input.name !== undefined ? input.name : user.name,
        avatarKey: input.avatarKey !== undefined ? input.avatarKey : user.avatarKey,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();

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
