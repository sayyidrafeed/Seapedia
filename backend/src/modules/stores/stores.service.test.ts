import { describe, expect, test, mock, beforeEach } from 'bun:test';

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

  const findFirstFn = () => {
    let currentPromise: Promise<unknown> | null = null;
    const handler = (_where?: unknown) => {
      const idx = dbState.selectIdx++;
      const data = dbState.selectQueue[idx] ?? [];
      currentPromise = Promise.resolve(data[0]);
      return currentPromise;
    };
    return handler;
  };

  const db = {
    query: {
      stores: {
        findFirst: findFirstFn(),
      },
    },
    select: makeSelect(),
    insert: makeInsert(),
    update: makeUpdate(),
    transaction: (fn: (tx: unknown) => unknown) => {
      const tx = {
        select: makeSelect(),
        insert: makeInsert(),
        update: makeUpdate(),
      };
      return fn(tx);
    },
  };

  return { db };
});

// ─── Import SUT ──────────────────────────────────────────────────────────────
import { StoreService } from './stores.service';

// ─── Test data helpers ───────────────────────────────────────────────────────
const makeStore = (overrides: Record<string, unknown> = {}) => ({
  id: 'store-1',
  sellerId: 'seller-1',
  name: 'My Store',
  description: 'A great store',
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  updatedAt: new Date('2024-01-01T00:00:00.000Z'),
  ...overrides,
});

// ─── Tests ───────────────────────────────────────────────────────────────────
describe('StoreService', () => {
  beforeEach(() => {
    dbState.reset();
  });

  describe('create', () => {
    const input = { name: 'My Store', description: 'A great store' };

    test('creates a store for the seller on success', async () => {
      dbState.addSelect([]); // no existing store
      dbState.addSelect([]); // name not taken
      dbState.addInsert([makeStore()]);

      const result = await StoreService.create('seller-1', input);

      expect(result.id).toBe('store-1');
      expect(result.name).toBe('My Store');
      expect(result.description).toBe('A great store');
      expect(result.sellerId).toBe('seller-1');
    });

    test('creates a store without optional description', async () => {
      dbState.addSelect([]);
      dbState.addSelect([]);
      dbState.addInsert([makeStore({ description: null })]);

      const result = await StoreService.create('seller-1', { name: 'My Store' });

      expect(result.description).toBeNull();
    });

    test('throws ConflictError when seller already has a store', async () => {
      dbState.addSelect([makeStore()]);

      await expect(StoreService.create('seller-1', input)).rejects.toThrow(
        'Seller already has a store',
      );
    });

    test('throws ConflictError when store name is already used', async () => {
      dbState.addSelect([]); // no existing store for seller
      dbState.addSelect([makeStore()]); // name taken

      await expect(StoreService.create('seller-1', input)).rejects.toThrow(
        'Store name is already used',
      );
    });
  });

  describe('getBySellerId', () => {
    test('returns the store when found', async () => {
      dbState.addSelect([makeStore()]);

      const result = await StoreService.getBySellerId('seller-1');

      expect(result.id).toBe('store-1');
      expect(result.name).toBe('My Store');
    });

    test('throws NotFoundError when store does not exist', async () => {
      dbState.addSelect([]);

      await expect(StoreService.getBySellerId('seller-1')).rejects.toThrow('Store not found');
    });
  });

  describe('update', () => {
    test('updates store description successfully', async () => {
      dbState.addSelect([makeStore()]); // existing store
      dbState.addUpdate([makeStore({ description: 'Updated description' })]);

      const result = await StoreService.update('seller-1', { description: 'Updated description' });

      expect(result.description).toBe('Updated description');
    });

    test('updates store name successfully', async () => {
      dbState.addSelect([makeStore()]); // existing store
      dbState.addSelect([]); // name not taken
      dbState.addUpdate([makeStore({ name: 'New Name' })]);

      const result = await StoreService.update('seller-1', { name: 'New Name' });

      expect(result.name).toBe('New Name');
    });

    test('throws NotFoundError when store does not exist', async () => {
      dbState.addSelect([]);

      await expect(StoreService.update('seller-1', { name: 'New Name' })).rejects.toThrow(
        'Store not found',
      );
    });

    test('throws ConflictError when new name is already taken', async () => {
      dbState.addSelect([makeStore()]); // existing store
      dbState.addSelect([makeStore({ name: 'Taken Name' })]); // name taken

      await expect(StoreService.update('seller-1', { name: 'Taken Name' })).rejects.toThrow(
        'Store name is already used',
      );
    });
  });

  describe('getPublic', () => {
    test('finds store by UUID', async () => {
      dbState.addSelect([makeStore()]);

      const result = await StoreService.getPublic('store-1');

      expect(result.id).toBe('store-1');
    });

    test('falls back to name lookup when UUID not found', async () => {
      dbState.addSelect([]); // not found by UUID
      dbState.addSelect([makeStore()]); // found by name

      const result = await StoreService.getPublic('00000000-0000-1000-8000-000000000000');

      expect(result.name).toBe('My Store');
    });

    test('skips UUID lookup when slug is not a UUID', async () => {
      dbState.addSelect([makeStore()]); // found by name (only one lookup)

      const result = await StoreService.getPublic('my-store');

      expect(result.name).toBe('My Store');
    });

    test('throws NotFoundError when store is not found by either method', async () => {
      dbState.addSelect([]); // not found by UUID
      dbState.addSelect([]); // not found by name

      await expect(StoreService.getPublic('nonexistent')).rejects.toThrow('Store not found');
    });
  });
});
