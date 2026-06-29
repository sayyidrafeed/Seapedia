import { describe, expect, test, mock, beforeEach, afterAll, spyOn } from 'bun:test';

// ─── Mock state ──────────────────────────────────────────────────────────────
const dbState = {
  selectQueue: [] as unknown[][],
  insertQueue: [] as unknown[][],
  updateQueue: [] as unknown[][],
  selectIdx: 0,
  insertIdx: 0,
  updateIdx: 0,

  reset() {
    this.selectQueue = [];
    this.insertQueue = [];
    this.updateQueue = [];
    this.selectIdx = 0;
    this.insertIdx = 0;
    this.updateIdx = 0;
  },

  addSelect(data: unknown[]) {
    this.selectQueue.push(data);
  },
  addInsert(data: unknown[]) {
    this.insertQueue.push(data);
  },
  addUpdate(data: unknown[]) {
    this.updateQueue.push(data);
  },
};

// ─── Mock @/db ───────────────────────────────────────────────────────────────
mock.module('@/db', () => {
  function makeSelect() {
    return () => ({
      from: () => ({
        where: () => {
          const idx = dbState.selectIdx++;
          const data = dbState.selectQueue[idx] ?? [];
          return Object.assign(Promise.resolve(data), {
            limit: (n: number) => Promise.resolve(data.slice(0, n)),
            leftJoin: () => ({
              where: () => {
                const idx2 = dbState.selectIdx++;
                const data2 = dbState.selectQueue[idx2] ?? [];
                return Object.assign(Promise.resolve(data2), {
                  limit: (n: number) => Promise.resolve(data2.slice(0, n)),
                });
              },
            }),
          });
        },
      }),
    });
  }

  function makeInsert() {
    return () => ({
      values: () => {
        const idx = dbState.insertIdx;
        return Object.assign(Promise.resolve(undefined), {
          returning: () => {
            dbState.insertIdx++;
            return Promise.resolve(dbState.insertQueue[idx] ?? []);
          },
        });
      },
    });
  }

  function makeUpdate() {
    return () => ({
      set: () => ({
        where: () => {
          const idx = dbState.updateIdx;
          return Object.assign(Promise.resolve(undefined), {
            returning: () => {
              dbState.updateIdx++;
              return Promise.resolve(dbState.updateQueue[idx] ?? []);
            },
          });
        },
      }),
    });
  }

  function makeDelete() {
    return () => ({
      where: () => Promise.resolve(undefined),
    });
  }

  const db = {
    select: makeSelect(),
    insert: makeInsert(),
    update: makeUpdate(),
    delete: makeDelete(),
    transaction: (fn: (tx: unknown) => unknown) => {
      const tx = {
        select: makeSelect(),
        insert: makeInsert(),
        update: makeUpdate(),
        delete: makeDelete(),
      };
      return fn(tx);
    },
  };

  return { db };
});

// ─── Mock Bun.password ───────────────────────────────────────────────────────
const mockHash = spyOn(Bun.password, 'hash');
const mockVerify = spyOn(Bun.password, 'verify');

// ─── Import SUT ──────────────────────────────────────────────────────────────
import { AuthService } from './auth.service';

// ─── Test data helpers ───────────────────────────────────────────────────────
const makeUser = (overrides: Record<string, unknown> = {}) => ({
  id: 'user-1',
  username: 'testuser',
  email: 'test@example.com',
  passwordHash: '$hashed_password',
  name: null as string | null,
  isOnboarded: false,
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  updatedAt: new Date('2024-01-01T00:00:00.000Z'),
  ...overrides,
});

const makeSession = (overrides: Record<string, unknown> = {}) => ({
  id: 'session-1',
  userId: 'user-1',
  activeRole: 'buyer',
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  updatedAt: new Date('2024-01-01T00:00:00.000Z'),
  ...overrides,
});

// ─── Tests ───────────────────────────────────────────────────────────────────
describe('AuthService', () => {
  beforeEach(() => {
    dbState.reset();
    mockHash.mockClear().mockResolvedValue('$hashed_password' as never);
    mockVerify.mockClear().mockResolvedValue(true);
  });

  afterAll(() => {
    mockHash.mockRestore();
    mockVerify.mockRestore();
  });

  describe('register', () => {
    const input = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
    };

    test('creates user with default buyer role and session on success', async () => {
      dbState.addSelect([]); // uniqueness check
      dbState.addInsert([makeUser({ name: 'Test User' })]);
      dbState.addInsert([makeSession()]);

      const result = await AuthService.register(input);

      expect(result.user.id).toBe('user-1');
      expect(result.user.username).toBe('testuser');
      expect(result.user.email).toBe('test@example.com');
      expect(result.session.activeRole).toBe('buyer');
      expect(mockHash).toHaveBeenCalledWith('password123', 'bcrypt');
    });

    test('throws ConflictError when username or email already exists', async () => {
      dbState.addSelect([makeUser()]);

      await expect(AuthService.register(input)).rejects.toThrow(
        'Username or email is already taken',
      );
    });
  });

  describe('login', () => {
    test('returns user, session, and roles on valid credentials', async () => {
      dbState.addSelect([makeUser()]);
      dbState.addSelect([{ id: 'r1', userId: 'user-1', role: 'buyer', createdAt: new Date() }]);
      dbState.addSelect([makeSession()]);

      const result = await AuthService.login({
        username: 'testuser',
        password: 'password123',
      });

      expect(result.user.id).toBe('user-1');
      expect(result.session.activeRole).toBe('buyer');
      expect(result.roles).toEqual(['buyer']);
      expect(mockVerify).toHaveBeenCalledWith('password123', '$hashed_password');
    });

    test('throws ValidationError when username is not found', async () => {
      dbState.addSelect([]);

      await expect(
        AuthService.login({ username: 'unknown', password: 'password123' }),
      ).rejects.toThrow('Invalid credentials');
    });

    test('throws ValidationError when password is incorrect', async () => {
      dbState.addSelect([makeUser()]);
      mockVerify.mockResolvedValue(false);

      await expect(AuthService.login({ username: 'testuser', password: 'wrong' })).rejects.toThrow(
        'Invalid credentials',
      );
    });

    test('creates new session when none exists', async () => {
      dbState.addSelect([makeUser()]);
      dbState.addSelect([{ id: 'r1', userId: 'user-1', role: 'buyer', createdAt: new Date() }]);
      dbState.addSelect([]); // no existing session
      dbState.addInsert([makeSession()]);

      const result = await AuthService.login({
        username: 'testuser',
        password: 'password123',
      });

      expect(result.session.id).toBe('session-1');
      expect(result.session.activeRole).toBe('buyer');
    });

    test('updates session when active role is no longer valid', async () => {
      dbState.addSelect([makeUser()]);
      dbState.addSelect([
        { id: 'r1', userId: 'user-1', role: 'seller', createdAt: new Date() },
        { id: 'r2', userId: 'user-1', role: 'buyer', createdAt: new Date() },
      ]);
      dbState.addSelect([makeSession({ activeRole: 'admin' })]); // admin not in role set
      dbState.addUpdate([makeSession({ activeRole: 'seller' })]);

      const result = await AuthService.login({
        username: 'testuser',
        password: 'password123',
      });

      expect(result.session.activeRole).toBe('seller');
      expect(result.roles).toEqual(['seller', 'buyer']);
    });

    test('assigns default buyer role and creates session when user has no roles', async () => {
      dbState.addSelect([makeUser()]);
      dbState.addSelect([]); // no roles
      dbState.addSelect([]); // no existing session
      dbState.addInsert([makeSession()]);

      const result = await AuthService.login({
        username: 'testuser',
        password: 'password123',
      });

      expect(result.roles).toEqual(['buyer']);
      expect(result.session.activeRole).toBe('buyer');
    });
  });

  describe('logout', () => {
    test('deletes the active session without throwing', async () => {
      await expect(AuthService.logout('session-1')).resolves.toBeUndefined();
    });
  });

  describe('selectRole', () => {
    test('updates session active role when user owns that role', async () => {
      dbState.addSelect([{ id: 'r1', userId: 'user-1', role: 'seller', createdAt: new Date() }]);
      dbState.addUpdate([makeSession({ activeRole: 'seller' })]);

      const result = await AuthService.selectRole('user-1', 'session-1', 'seller');

      expect(result.activeRole).toBe('seller');
    });

    test('throws ForbiddenError when user does not have that role', async () => {
      dbState.addSelect([]);

      await expect(AuthService.selectRole('user-1', 'session-1', 'admin')).rejects.toThrow(
        "You do not have access to the 'admin' role",
      );
    });

    test('throws NotFoundError when session does not exist', async () => {
      dbState.addSelect([{ id: 'r1', userId: 'user-1', role: 'seller', createdAt: new Date() }]);
      dbState.addUpdate([]); // empty update result

      await expect(AuthService.selectRole('user-1', 'session-1', 'seller')).rejects.toThrow(
        'Session not found',
      );
    });
  });

  describe('getUser', () => {
    test('returns the user when found', async () => {
      dbState.addSelect([makeUser({ name: 'Test User' })]);

      const user = await AuthService.getUser('user-1');

      expect(user.id).toBe('user-1');
      expect(user.username).toBe('testuser');
      expect(user.name).toBe('Test User');
    });

    test('throws NotFoundError when user is not found', async () => {
      dbState.addSelect([]);

      await expect(AuthService.getUser('nonexistent')).rejects.toThrow('User not found');
    });
  });

  describe('getSessionInfo', () => {
    test('returns session info with roles', async () => {
      dbState.addSelect([makeSession({ activeRole: 'seller' })]);
      dbState.addSelect([
        { id: 'r1', userId: 'user-1', role: 'buyer', createdAt: new Date() },
        { id: 'r2', userId: 'user-1', role: 'seller', createdAt: new Date() },
      ]);

      const info = await AuthService.getSessionInfo('user-1', 'session-1');

      expect(info).toEqual({
        userId: 'user-1',
        activeRole: 'seller',
        roles: ['buyer', 'seller'],
      });
    });

    test('throws NotFoundError when session is not found', async () => {
      dbState.addSelect([]);

      await expect(AuthService.getSessionInfo('user-1', 'session-1')).rejects.toThrow(
        'Session not found',
      );
    });
  });

  describe('onboard', () => {
    test('completes without error for valid roles', async () => {
      dbState.addSelect([makeUser({ isOnboarded: false })]);
      await expect(AuthService.onboard('user-1', ['seller', 'driver'])).resolves.toBeUndefined();
    });

    test('throws NotFoundError if user not found', async () => {
      dbState.addSelect([]);
      await expect(AuthService.onboard('user-1', ['seller', 'driver'])).rejects.toThrow(
        'User not found',
      );
    });

    test('throws ForbiddenError if user is already onboarded', async () => {
      dbState.addSelect([makeUser({ isOnboarded: true })]);
      await expect(AuthService.onboard('user-1', ['seller', 'driver'])).rejects.toThrow(
        'User is already onboarded',
      );
    });
  });
});
