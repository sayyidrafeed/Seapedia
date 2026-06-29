import { describe, expect, test, mock, beforeEach } from 'bun:test';

const dbState = {
  selectQueue: [] as unknown[][],
  insertQueue: [] as unknown[][],
  updateQueue: [] as unknown[][],
  deleteQueue: [] as unknown[][],
  selectIdx: 0,
  insertIdx: 0,
  updateIdx: 0,
  deleteIdx: 0,

  reset() {
    this.selectQueue = [];
    this.insertQueue = [];
    this.updateQueue = [];
    this.deleteQueue = [];
    this.selectIdx = 0;
    this.insertIdx = 0;
    this.updateIdx = 0;
    this.deleteIdx = 0;
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
  addDelete(data: unknown[]) {
    this.deleteQueue.push(data);
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
            innerJoin: () => ({
              where: () => Promise.resolve(data),
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
        return {
          returning: () => {
            dbState.insertIdx++;
            return Promise.resolve(dbState.insertQueue[idx] ?? []);
          },
        };
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
      where: () => {
        dbState.deleteIdx++;
        return Promise.resolve({ success: true });
      },
    });
  }

  const db = {
    select: makeSelect(),
    insert: makeInsert(),
    update: makeUpdate(),
    delete: makeDelete(),
  };

  return { db };
});

import { BuyersCartService } from './buyers-cart.service';
import { ConflictError, ValidationError } from '@/lib/errors';

describe('BuyersCartService', () => {
  beforeEach(() => {
    dbState.reset();
  });

  test('getOrCreateCart returns existing cart', async () => {
    const existing = { id: 'c1', buyerId: 'b1', storeId: null, createdAt: new Date(), updatedAt: new Date() };
    dbState.addSelect([existing]);

    const cart = await BuyersCartService.getOrCreateCart('b1');
    expect(cart).toEqual(existing);
    expect(dbState.selectIdx).toBe(1);
  });

  test('getOrCreateCart creates new cart when none exists', async () => {
    dbState.addSelect([]); // select returns empty
    const created = { id: 'c1', buyerId: 'b1', storeId: null, createdAt: new Date(), updatedAt: new Date() };
    dbState.addInsert([created]);

    const cart = await BuyersCartService.getOrCreateCart('b1');
    expect(cart).toEqual(created);
    expect(dbState.selectIdx).toBe(1);
    expect(dbState.insertIdx).toBe(1);
  });

  test('addItemToCart throws ConflictError if store mismatch', async () => {
    // 1. select product (exists in store A)
    dbState.addSelect([{ id: 'p1', storeId: 'storeA', name: 'Product 1', price: 1000, stock: 10 }]);
    // 2. select cart (belongs to store B)
    dbState.addSelect([{ id: 'c1', buyerId: 'b1', storeId: 'storeB', createdAt: new Date(), updatedAt: new Date() }]);

    expect(BuyersCartService.addItemToCart('b1', 'p1', 1)).rejects.toThrow(ConflictError);
  });

  test('addItemToCart inserts new cart item successfully', async () => {
    const product = { id: 'p1', storeId: 'storeA', name: 'Product 1', price: 1000, stock: 10 };
    const cart = { id: 'c1', buyerId: 'b1', storeId: null, createdAt: new Date(), updatedAt: new Date() };
    const newItem = { id: 'ci1', cartId: 'c1', productId: 'p1', quantity: 2, createdAt: new Date(), updatedAt: new Date() };

    dbState.addSelect([product]);
    dbState.addSelect([cart]);
    dbState.addUpdate([cart]); // update cart storeId
    dbState.addSelect([]); // no existing item in cart
    dbState.addInsert([newItem]);

    const result = await BuyersCartService.addItemToCart('b1', 'p1', 2);
    expect(result).toEqual(newItem);
  });

  test('addItemToCart throws ValidationError if quantity exceeds stock', async () => {
    const product = { id: 'p1', storeId: 'storeA', name: 'Product 1', price: 1000, stock: 1 };
    dbState.addSelect([product]);

    expect(BuyersCartService.addItemToCart('b1', 'p1', 5)).rejects.toThrow(ValidationError);
  });
});
