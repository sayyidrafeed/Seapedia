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
  const dbSelect = () => ({
    from: () => ({
      innerJoin: () => ({
        innerJoin: () => ({
          where: () => {
            const data = dbState.selectQueue[dbState.selectIdx++] ?? [];
            return Object.assign(Promise.resolve(data), {
              limit: (n: number) => Promise.resolve(data.slice(0, n)),
            });
          },
        }),
        where: () => {
          const data = dbState.selectQueue[dbState.selectIdx++] ?? [];
          return Object.assign(Promise.resolve(data), {
            limit: (n: number) => Promise.resolve(data.slice(0, n)),
          });
        },
      }),
    }),
  });

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
    const res = await DriverService.getJobDetail('job-1');
    expect(res.id).toBe('job-1');
    expect(res.addressSnapshot).toEqual(mockAddr);
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
    dbState.addSelect([{ ...mockJob, id: 'job-active', status: 'taken' }]);
    dbState.addSelect([
      { ...mockJob, id: 'job-completed', status: 'completed', deliveryFee: 8000 },
    ]);
    const res = await DriverService.getDriverStats('driver-1');
    expect(res.totalEarnings).toBe(8000);
    expect(res.completedJobsCount).toBe(1);
    expect(res.activeJobs).toHaveLength(1);
    expect(res.completedJobs).toHaveLength(1);
  });
});
