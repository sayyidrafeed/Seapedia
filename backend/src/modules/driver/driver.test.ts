import { describe, expect, test, mock, beforeEach } from 'bun:test';

const dbState = {
  selectQueue: [] as unknown[][],
  selectIdx: 0,

  reset() {
    this.selectQueue = [];
    this.selectIdx = 0;
  },

  addSelect(data: unknown[]) {
    this.selectQueue.push(data);
  },
};

mock.module('@/db', () => {
  function makeSelect() {
    return () => ({
      from: () => ({
        innerJoin: () => ({
          innerJoin: () => ({
            where: () => {
              const idx = dbState.selectIdx++;
              const data = dbState.selectQueue[idx] ?? [];
              return Object.assign(Promise.resolve(data), {
                limit: (n: number) => Promise.resolve(data.slice(0, n)),
              });
            },
          }),
          where: () => {
            const idx = dbState.selectIdx++;
            const data = dbState.selectQueue[idx] ?? [];
            return Object.assign(Promise.resolve(data), {
              limit: (n: number) => Promise.resolve(data.slice(0, n)),
            });
          },
        }),
      }),
    });
  }

  const dbSelect = makeSelect();

  const db = {
    select: dbSelect,
  };

  return { db };
});

import { DriverService } from './driver.service';
import { NotFoundError } from '@/lib/errors';

describe('DriverService', () => {
  beforeEach(() => {
    dbState.reset();
  });

  const mockAddress = {
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
    addressSnapshot: JSON.stringify(mockAddress),
    totalAmount: 16200,
  };

  test('getAvailableJobs returns formatted delivery jobs', async () => {
    dbState.addSelect([mockJob]);

    const result = await DriverService.getAvailableJobs();

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('job-1');
    expect(result[0].storeName).toBe('Test Store');
    expect(result[0].addressSnapshot).toEqual(mockAddress);
  });

  test('getJobDetail returns job details successfully', async () => {
    dbState.addSelect([mockJob]);

    const result = await DriverService.getJobDetail('job-1');

    expect(result.id).toBe('job-1');
    expect(result.storeName).toBe('Test Store');
    expect(result.addressSnapshot).toEqual(mockAddress);
  });

  test('getJobDetail throws NotFoundError if job does not exist', async () => {
    dbState.addSelect([]); // empty result

    expect(DriverService.getJobDetail('job-nonexistent')).rejects.toThrow(NotFoundError);
  });
});
