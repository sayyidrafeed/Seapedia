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
  const dbSelect = () => {
    const builder = {
      from: () => builder,
      innerJoin: () => builder,
      where: () => {
        const data = dbState.selectQueue[dbState.selectIdx++] ?? [];
        const chain = Object.assign(Promise.resolve(data), {
          orderBy: () => null as unknown,
          limit: (n: number) => {
            const sliced = data.slice(0, n);
            return Object.assign(Promise.resolve(sliced), {
              offset: (o: number) => Promise.resolve(sliced.slice(o)),
            });
          },
          offset: (o: number) => Promise.resolve(data.slice(o)),
        });
        (chain as unknown as Record<string, unknown>).orderBy = () => chain;
        return chain;
      },
    };
    return builder;
  };

  const dbInsert = () => ({
    values: () => ({
      returning: () => Promise.resolve(dbState.insertQueue[dbState.insertIdx++] ?? []),
    }),
  });

  const dbUpdate = () => ({
    set: () => ({
      where: () =>
        Object.assign(Promise.resolve(undefined), {
          returning: () => Promise.resolve(dbState.updateQueue[dbState.updateIdx++] ?? []),
        }),
    }),
  });

  return {
    db: {
      select: dbSelect,
      insert: dbInsert,
      update: dbUpdate,
      transaction: <T>(
        cb: (tx: {
          select: typeof dbSelect;
          insert: typeof dbInsert;
          update: typeof dbUpdate;
        }) => Promise<T>,
      ) => cb({ select: dbSelect, insert: dbInsert, update: dbUpdate }),
    },
  };
});

import { DriverService } from './driver.service';
import { NotFoundError, ConflictError } from '@/lib/errors';

describe('DriverService', () => {
  beforeEach(() => dbState.reset());

  const mockAddr = {
    recipientName: 'Alice',
    phoneNumber: '123',
    fullAddress: 'Road 1',
    district: 'Dist',
    city: 'City',
    province: 'Prov',
    postalCode: '111',
    label: 'Home',
  };

  const mockJob = {
    id: 'job-1',
    orderId: 'order-1',
    driverId: null,
    status: 'pending',
    deliveryFee: 5000,
    createdAt: new Date(),
    updatedAt: new Date(),
    storeName: 'Test Store',
    deliveryMethod: 'regular',
    addressSnapshot: JSON.stringify(mockAddr),
    totalAmount: 16200,
  };

  test('getAvailableJobs returns formatted delivery jobs', async () => {
    dbState.addSelect([mockJob]);
    const res = await DriverService.getAvailableJobs();
    expect(res).toHaveLength(1);
    expect(res[0].id).toBe('job-1');
    expect(res[0].addressSnapshot).toEqual(mockAddr);
  });

  test('getJobDetail returns job details successfully', async () => {
    dbState.addSelect([mockJob]);
    dbState.addSelect([
      { id: 'item-1', productId: 'p-1', productName: 'Item A', productPrice: 1000, quantity: 2 },
    ]);
    const res = await DriverService.getJobDetail('job-1');
    expect(res.id).toBe('job-1');
    expect(res.addressSnapshot).toEqual(mockAddr);
    expect(res.items).toHaveLength(1);
    expect(res.items[0].productName).toBe('Item A');
    expect(res.items[0].productPrice).toBe(1000);
  });

  test('getJobDetail throws NotFoundError if job does not exist', async () => {
    dbState.addSelect([]);
    expect(DriverService.getJobDetail('job-nonexistent')).rejects.toThrow(NotFoundError);
  });

  test('takeJob successfully updates job and order status', async () => {
    dbState.addUpdate([{ ...mockJob, status: 'taken', driverId: 'driver-1' }]);
    dbState.addUpdate([{ id: 'order-1', status: 'sedang_dikirim' }]);
    dbState.addInsert([{ id: 'history-1' }]);
    const res = await DriverService.takeJob('job-1', 'driver-1');
    expect(res.success).toBe(true);
  });

  test('takeJob throws ConflictError if job already taken', async () => {
    dbState.addUpdate([]);
    expect(DriverService.takeJob('job-1', 'driver-1')).rejects.toThrow(ConflictError);
  });

  test('completeJob successfully updates status to complete', async () => {
    dbState.addUpdate([{ ...mockJob, status: 'completed', driverId: 'driver-1' }]);
    dbState.addUpdate([{ id: 'order-1', status: 'pesanan_selesai' }]);
    dbState.addInsert([{ id: 'history-2' }]);
    const res = await DriverService.completeJob('job-1', 'driver-1');
    expect(res.success).toBe(true);
  });

  test('getDriverStats returns correct dashboard stats', async () => {
    // 1. Active jobs query
    dbState.addSelect([{ ...mockJob, id: 'job-active', status: 'taken' }]);
    // 2. Aggregate stats query
    dbState.addSelect([{ totalEarnings: 8000, completedCount: 1 }]);
    // 3. Completed jobs list query
    dbState.addSelect([
      { ...mockJob, id: 'job-completed', status: 'completed', deliveryFee: 8000 },
    ]);
    const res = await DriverService.getDriverStats('driver-1');
    expect(res.totalEarnings).toBe(8000);
    expect(res.completedJobsCount).toBe(1);
    expect(res.activeJobs).toHaveLength(1);
    expect(res.completedJobs).toHaveLength(1);
  });

  test('getJobHistory returns paginated completed jobs', async () => {
    // 1. Query for completed jobs list
    dbState.addSelect([
      { ...mockJob, id: 'job-completed-1', status: 'completed' },
      { ...mockJob, id: 'job-completed-2', status: 'completed' },
    ]);
    // 2. Query for total count
    dbState.addSelect([{ count: 2 }]);

    const res = await DriverService.getJobHistory('driver-1', { page: 1, limit: 10 });
    expect(res.jobs).toHaveLength(2);
    expect(res.total).toBe(2);
    expect(res.jobs[0].id).toBe('job-completed-1');
  });
});
