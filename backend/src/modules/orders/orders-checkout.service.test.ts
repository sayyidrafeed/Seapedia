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
        innerJoin: () => ({
          where: () => {
            const idx = dbState.selectIdx++;
            const data = dbState.selectQueue[idx] ?? [];
            return Object.assign(Promise.resolve(data), {
              limit: (n: number) => Promise.resolve(data.slice(0, n)),
              orderBy: () => Promise.resolve(data),
            });
          },
        }),
        where: () => {
          const idx = dbState.selectIdx++;
          const data = dbState.selectQueue[idx] ?? [];
          return Object.assign(Promise.resolve(data), {
            limit: (n: number) => Promise.resolve(data.slice(0, n)),
            orderBy: () => Promise.resolve(data),
          });
        },
      }),
    });
  }

  function makeInsert() {
    return () => ({
      values: () => {
        const idx = dbState.insertIdx;
        const returningFn = () => {
          dbState.insertIdx++;
          return Promise.resolve(dbState.insertQueue[idx] ?? []);
        };
        return {
          returning: returningFn,
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

  const dbSelect = makeSelect();
  const dbInsert = makeInsert();
  const dbUpdate = makeUpdate();
  const dbDelete = makeDelete();

  const db = {
    select: dbSelect,
    insert: dbInsert,
    update: dbUpdate,
    delete: dbDelete,
    transaction: <T>(
      cb: (tx: {
        select: typeof dbSelect;
        insert: typeof dbInsert;
        update: typeof dbUpdate;
        delete: typeof dbDelete;
      }) => Promise<T>,
    ) =>
      cb({
        select: dbSelect,
        insert: dbInsert,
        update: dbUpdate,
        delete: dbDelete,
      }),
  };

  return { db };
});

import { OrdersCheckoutService } from './orders-checkout.service';
import { ValidationError, NotFoundError } from '@/lib/errors';

describe('OrdersCheckoutService', () => {
  beforeEach(() => {
    dbState.reset();
  });

  test('calculateTotals computes correctly for instant delivery', () => {
    const { deliveryFee, taxBase, ppn, totalAmount } = OrdersCheckoutService.calculateTotals(
      100000,
      'instant',
    );
    expect(deliveryFee).toBe(30000);
    expect(taxBase).toBe(130000);
    expect(ppn).toBe(15600); // 130000 * 0.12 = 15600
    expect(totalAmount).toBe(145600);
  });

  test('calculateTotals computes correctly for regular delivery', () => {
    const { deliveryFee, taxBase, ppn, totalAmount } = OrdersCheckoutService.calculateTotals(
      100000,
      'regular',
    );
    expect(deliveryFee).toBe(10000);
    expect(taxBase).toBe(110000);
    expect(ppn).toBe(13200); // 110000 * 0.12 = 13200
    expect(totalAmount).toBe(123200);
  });

  test('createOrder throws NotFoundError if address not found or not owned', async () => {
    dbState.addSelect([]); // select address returns empty

    expect(OrdersCheckoutService.createOrder('buyer1', 'regular', 'addr1')).rejects.toThrow(
      NotFoundError,
    );
  });

  test('createOrder throws ValidationError if cart is empty', async () => {
    const address = {
      id: 'addr1',
      userId: 'buyer1',
      label: 'Home',
      recipientName: 'Rafee',
      phoneNumber: '08123456789',
      province: 'DKI Jakarta',
      city: 'Jakarta Selatan',
      district: 'Kebayoran Baru',
      postalCode: '12110',
      fullAddress: 'Jl. Sudirman No. 1',
      isDefault: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    dbState.addSelect([address]); // select address
    dbState.addSelect([]); // select cart returns empty

    expect(OrdersCheckoutService.createOrder('buyer1', 'regular', 'addr1')).rejects.toThrow(
      ValidationError,
    );
  });

  test('createOrder throws ValidationError if wallet balance is insufficient', async () => {
    const address = {
      id: 'addr1',
      userId: 'buyer1',
      label: 'Home',
      recipientName: 'Rafee',
      phoneNumber: '08123456789',
      province: 'DKI Jakarta',
      city: 'Jakarta Selatan',
      district: 'Kebayoran Baru',
      postalCode: '12110',
      fullAddress: 'Jl. Sudirman No. 1',
      isDefault: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const cart = { id: 'cart1', buyerId: 'buyer1', storeId: 'store1' };
    const cartItemWithProduct = [
      {
        cartItemId: 'ci1',
        productId: 'prod1',
        quantity: 2,
        product: {
          id: 'prod1',
          name: 'Super Product',
          price: 50000,
          stock: 10,
          storeId: 'store1',
        },
      },
    ];
    const wallet = { id: 'wallet1', userId: 'buyer1', balance: 5000 }; // 5000 < (100000 + 10000) * 1.12 = 123200

    dbState.addSelect([address]); // select address
    dbState.addSelect([cart]); // select cart
    dbState.addSelect(cartItemWithProduct); // select cartItems innerJoin products
    dbState.addSelect([wallet]); // select wallet

    expect(OrdersCheckoutService.createOrder('buyer1', 'regular', 'addr1')).rejects.toThrow(
      ValidationError,
    );
  });

  test('createOrder throws ValidationError if product stock is insufficient', async () => {
    const address = {
      id: 'addr1',
      userId: 'buyer1',
      label: 'Home',
      recipientName: 'Rafee',
      phoneNumber: '08123456789',
      province: 'DKI Jakarta',
      city: 'Jakarta Selatan',
      district: 'Kebayoran Baru',
      postalCode: '12110',
      fullAddress: 'Jl. Sudirman No. 1',
      isDefault: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const cart = { id: 'cart1', buyerId: 'buyer1', storeId: 'store1' };
    const cartItemWithProduct = [
      {
        cartItemId: 'ci1',
        productId: 'prod1',
        quantity: 2,
        product: {
          id: 'prod1',
          name: 'Super Product',
          price: 50000,
          stock: 1, // stock is 1, quantity is 2
          storeId: 'store1',
        },
      },
    ];
    const wallet = { id: 'wallet1', userId: 'buyer1', balance: 200000 };

    dbState.addSelect([address]); // select address
    dbState.addSelect([cart]); // select cart
    dbState.addSelect(cartItemWithProduct); // select cartItems innerJoin products
    dbState.addSelect([wallet]); // select wallet

    expect(OrdersCheckoutService.createOrder('buyer1', 'regular', 'addr1')).rejects.toThrow(
      ValidationError,
    );
  });

  test('createOrder successfully processes order when all conditions met', async () => {
    const address = {
      id: 'addr1',
      userId: 'buyer1',
      label: 'Home',
      recipientName: 'Rafee',
      phoneNumber: '08123456789',
      province: 'DKI Jakarta',
      city: 'Jakarta Selatan',
      district: 'Kebayoran Baru',
      postalCode: '12110',
      fullAddress: 'Jl. Sudirman No. 1',
      isDefault: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const cart = { id: 'cart1', buyerId: 'buyer1', storeId: 'store1' };
    const cartItemWithProduct = [
      {
        cartItemId: 'ci1',
        productId: 'prod1',
        quantity: 2,
        product: {
          id: 'prod1',
          name: 'Super Product',
          price: 50000,
          stock: 10,
          storeId: 'store1',
        },
      },
    ];
    const wallet = { id: 'wallet1', userId: 'buyer1', balance: 200000 };
    const order = { id: 'order1', buyerId: 'buyer1', storeId: 'store1' };

    dbState.addSelect([address]); // select address
    dbState.addSelect([cart]); // select cart
    dbState.addSelect(cartItemWithProduct); // select cartItems innerJoin products
    dbState.addSelect([wallet]); // select wallet

    // Updates
    dbState.addUpdate([{ id: 'prod1', stock: 8 }]); // update stock returning
    dbState.addUpdate([{ id: 'wallet1', balance: 76800 }]); // update wallet balance returning

    // Inserts
    dbState.addInsert([{ id: 'wt1' }]); // insert wallet transaction returning
    dbState.addInsert([order]); // insert order returning
    dbState.addInsert([{ id: 'oi1' }]); // insert order item returning
    dbState.addInsert([{ id: 'osh1' }]); // insert order status history returning

    const result = await OrdersCheckoutService.createOrder('buyer1', 'regular', 'addr1');
    expect(result as unknown).toEqual(order);
  });
});
