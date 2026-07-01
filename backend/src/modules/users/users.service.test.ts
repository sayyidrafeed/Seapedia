import { describe, expect, test, mock, beforeEach } from 'bun:test';

const dbState = {
  selectQueue: [] as unknown[][],
  updateQueue: [] as unknown[][],
  selectIdx: 0,
  updateIdx: 0,

  reset() {
    this.selectQueue = [];
    this.updateQueue = [];
    this.selectIdx = 0;
    this.updateIdx = 0;
  },

  addSelect(data: unknown[]) {
    this.selectQueue.push(data);
  },
  addUpdate(data: unknown[]) {
    this.updateQueue.push(data);
  },
};

mock.module('@/db', () => {
  function makeSelect() {
    return () => ({
      from: () => ({
        where: () => {
          const idx = dbState.selectIdx++;
          const data = dbState.selectQueue[idx] ?? [];
          return Object.assign(Promise.resolve(data), {
            limit: (n: number) => Promise.resolve(data.slice(0, n)),
          });
        },
      }),
    });
  }

  function makeUpdate() {
    return () => ({
      set: () => ({
        where: () => {
          const idx = dbState.updateIdx;
          return {
            returning: () => {
              dbState.updateIdx++;
              return Promise.resolve(dbState.updateQueue[idx] ?? []);
            },
          };
        },
      }),
    });
  }

  const findFirstFn = () => {
    return () => {
      const idx = dbState.selectIdx++;
      const data = dbState.selectQueue[idx] ?? [];
      return Promise.resolve(data[0]);
    };
  };

  const db = {
    query: {
      users: {
        findFirst: findFirstFn(),
      },
    },
    select: makeSelect(),
    update: makeUpdate(),
  };

  return { db };
});

const storageState = {
  deleteCalls: [] as string[],
  reset() {
    this.deleteCalls = [];
  },
};

mock.module('@/lib/storage', () => {
  return {
    StorageService: {
      generatePresignedUpload: (prefix: string, _mimeType: string) => {
        return Promise.resolve({
          uploadUrl: `https://r2-mock.com/${prefix}/file.png`,
          objectKey: `${prefix}/file.png`,
          publicUrl: `https://cdn.mock.com/${prefix}/file.png`,
        });
      },
      deleteObject: (key: string) => {
        storageState.deleteCalls.push(key);
        return Promise.resolve();
      },
      getPublicUrl: (key: string) => {
        return `https://cdn.mock.com/${key}`;
      },
    },
  };
});

import { UsersService } from './users.service';
import { NotFoundError } from '@/lib/errors';

const makeUser = (overrides: Record<string, unknown> = {}) => ({
  id: 'user-1',
  username: 'testuser',
  email: 'test@test.com',
  name: 'Test User',
  avatarKey: null,
  isOnboarded: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe('UsersService', () => {
  beforeEach(() => {
    dbState.reset();
    storageState.reset();
  });

  describe('presignAvatar', () => {
    test('generates presigned avatar URL successfully', async () => {
      dbState.addSelect([makeUser()]); // user exists
      const result = await UsersService.presignAvatar('user-1', 'image/png');
      expect(result.uploadUrl).toBe('https://r2-mock.com/users/avatars/file.png');
      expect(result.objectKey).toBe('users/avatars/file.png');
    });

    test('throws NotFoundError if user not found', async () => {
      dbState.addSelect([]); // user not found
      await expect(UsersService.presignAvatar('user-1', 'image/png')).rejects.toThrow(
        NotFoundError,
      );
    });
  });

  describe('updateProfile', () => {
    test('updates profile successfully', async () => {
      const user = makeUser();
      dbState.addSelect([user]); // select user
      dbState.addUpdate([makeUser({ name: 'Updated Name' })]); // update user

      const result = await UsersService.updateProfile('user-1', { name: 'Updated Name' });
      expect(result.name).toBe('Updated Name');
      expect(storageState.deleteCalls.length).toBe(0); // no old avatar to delete
    });

    test('deletes old avatar from R2 when updating to new avatar', async () => {
      const user = makeUser({ avatarKey: 'users/avatars/old.png' });
      dbState.addSelect([user]); // select user
      dbState.addUpdate([makeUser({ avatarKey: 'users/avatars/new.png' })]); // update user

      const result = await UsersService.updateProfile('user-1', {
        avatarKey: 'users/avatars/new.png',
      });
      expect(result.avatarKey).toBe('users/avatars/new.png');
      expect(storageState.deleteCalls).toContain('users/avatars/old.png');
    });
  });
});
