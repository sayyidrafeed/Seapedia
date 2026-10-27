import { afterAll, afterEach, describe, expect, mock, spyOn, test } from 'bun:test';
import { NotFoundError } from '@seapedia/platform/errors';
import { db } from '@/db';
import { userRole, users } from '@/db/schema';
import { StorageService } from '@/lib/storage';
import { outboxEvents } from '../../../test/db';
import { UsersService } from './users.service';

// R2 is the external boundary; the database is real.
const presign = spyOn(StorageService, 'generatePresignedUpload').mockResolvedValue({
  uploadUrl: 'https://r2.test/users/avatars/file.png',
  objectKey: 'users/avatars/file.png',
  publicUrl: 'https://cdn.test/users/avatars/file.png',
});
const deleteObject = spyOn(StorageService, 'deleteObject').mockResolvedValue();

afterEach(() => {
  presign.mockClear();
  deleteObject.mockClear();
});
afterAll(() => mock.restore());

async function seedUser(avatarKey: string | null = null) {
  const [user] = await db
    .insert(users)
    .values({ username: 'dewi', email: 'dewi@example.com', passwordHash: 'x', avatarKey })
    .returning();
  await db.insert(userRole).values({ userId: user.id, role: 'seller' });
  return user;
}

const MISSING = '00000000-0000-4000-8000-000000000000';

describe('presignAvatar', () => {
  test('signs an upload under the avatars prefix for an existing user', async () => {
    const user = await seedUser();
    const result = await UsersService.presignAvatar(user.id, 'image/png');
    expect(result.objectKey).toBe('users/avatars/file.png');
    expect(presign).toHaveBeenCalledWith('users/avatars', 'image/png');
  });

  test('throws NotFoundError if user not found', async () => {
    await expect(UsersService.presignAvatar(MISSING, 'image/png')).rejects.toThrow(NotFoundError);
  });
});

describe('updateProfile', () => {
  test('renames the user and publishes the new display name with a newer version', async () => {
    const user = await seedUser();

    const result = await UsersService.updateProfile(user.id, { name: 'Dewi Lestari' });

    expect(result).toMatchObject({ name: 'Dewi Lestari', version: 2 });
    expect(deleteObject).not.toHaveBeenCalled();
    const [updated] = await outboxEvents();
    expect(updated).toMatchObject({
      type: 'identity.user.updated',
      version: 2,
      data: { displayName: 'Dewi Lestari', roles: ['seller'] },
    });
  });

  test('deletes the old avatar from R2 after the new one is saved', async () => {
    const user = await seedUser('users/avatars/old.png');

    const result = await UsersService.updateProfile(user.id, {
      avatarKey: 'users/avatars/new.png',
    });

    expect(result.avatarKey).toBe('users/avatars/new.png');
    expect(deleteObject).toHaveBeenCalledWith('users/avatars/old.png');
  });
});
