import { describe, expect, test, mock, beforeEach } from 'bun:test';

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

  const dbSelect = makeSelect();
  const dbInsert = makeInsert();
  const dbUpdate = makeUpdate();

  const db = {
    select: dbSelect,
    insert: dbInsert,
    update: dbUpdate,
    transaction: <T>(
      cb: (tx: {
        select: typeof dbSelect;
        insert: typeof dbInsert;
        update: typeof dbUpdate;
      }) => Promise<T>,
    ) =>
      cb({
        select: dbSelect,
        insert: dbInsert,
        update: dbUpdate,
      }),
  };

  return { db };
});

import { OrdersSellerService } from './orders-seller.service';
import { NotFoundError, ConflictError } from '@/lib/errors';

describe('OrdersSellerService', () => {
  beforeEach(() => {
    dbState.reset();
  });

  const mockStore = { id: 'store-1', name: 'Test Store', sellerId: 'seller-1' };
  const mockOrder = {
    id: 'order-1',
    buyerId: 'buyer-1',
    storeId: 'store-1',
    deliveryMethod: 'regular',
    subtotal: 10000,
    discountAmount: 0,
    discountCode: null,
    discountType: null,
    deliveryFee: 5000,
    ppn: 1200,
    totalAmount: 16200,
    status: 'sedang_dikemas',
    addressSnapshot: JSON.stringify({
      recipientName: 'Alice',
      phoneNumber: '123',
      fullAddress: 'Road 1',
      district: 'Dist',
      city: 'City',
      province: 'Prov',
      postalCode: '111',
      label: 'Home',
    }),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockOrderItems = [
    {
      id: 'item-1',
      orderId: 'order-1',
      productId: 'prod-1',
      productName: 'Prod 1',
      productPrice: 10000,
      quantity: 1,
    },
  ];

  const mockStatusHistory = [
    {
      id: 'hist-1',
      orderId: 'order-1',
      status: 'sedang_dikemas',
      note: 'Created',
      createdAt: new Date(),
    },
  ];

  test('processOrder successfully updates status and inserts history', async () => {
    // 1. SELECT store
    dbState.addSelect([mockStore]);
    // 2. SELECT order (for checking current status)
    dbState.addSelect([mockOrder]);

    // Transaction will run update & insert

    // Inside getDetail:
    // 3. SELECT store
    dbState.addSelect([mockStore]);
    // 4. SELECT order (inner join stores)
    dbState.addSelect([{ ...mockOrder, status: 'menunggu_pengirim', storeName: mockStore.name }]);
    // 5. SELECT orderItems
    dbState.addSelect(mockOrderItems);
    // 6. SELECT orderStatusHistory
    const updatedStatusHistory = [
      {
        id: 'hist-2',
        orderId: 'order-1',
        status: 'menunggu_pengirim',
        note: 'Ready to ship',
        createdAt: new Date(),
      },
      ...mockStatusHistory,
    ];
    dbState.addSelect(updatedStatusHistory);

    const result = await OrdersSellerService.processOrder('seller-1', 'order-1', 'Ready to ship');

    expect(result.status).toBe('menunggu_pengirim');
    expect(result.statusHistory).toHaveLength(2);
    expect(result.statusHistory[0].status).toBe('menunggu_pengirim');
    expect(result.statusHistory[0].note).toBe('Ready to ship');
  });

  test('processOrder throws NotFoundError if store not found', async () => {
    dbState.addSelect([]); // store select returns empty

    expect(OrdersSellerService.processOrder('seller-1', 'order-1')).rejects.toThrow(NotFoundError);
  });

  test('processOrder throws NotFoundError if order not found', async () => {
    dbState.addSelect([mockStore]);
    dbState.addSelect([]); // order select returns empty

    expect(OrdersSellerService.processOrder('seller-1', 'order-1')).rejects.toThrow(NotFoundError);
  });

  test('processOrder throws ConflictError if order is already processed', async () => {
    const alreadyProcessedOrder = { ...mockOrder, status: 'menunggu_pengirim' };
    dbState.addSelect([mockStore]);
    dbState.addSelect([alreadyProcessedOrder]); // order is already processed

    expect(OrdersSellerService.processOrder('seller-1', 'order-1')).rejects.toThrow(ConflictError);
  });
});
