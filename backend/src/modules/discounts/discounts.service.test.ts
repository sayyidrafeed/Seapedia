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
  };

  return { db };
});

import { DiscountsService } from './discounts.service';
import { ValidationError, NotFoundError } from '@/lib/errors';

describe('DiscountsService', () => {
  beforeEach(() => {
    dbState.reset();
  });

  test('validateCode returns flat discount for valid voucher', async () => {
    const voucher = {
      id: 'v1',
      code: 'SAVE10',
      discountAmount: 10000,
      minOrderAmount: 30000,
      expiresAt: new Date(Date.now() + 1000000),
      remainingUsage: 5,
    };
    dbState.addSelect([voucher]); // select voucher matches

    const result = await DiscountsService.validateCode('SAVE10', 50000);
    expect(result.type).toBe('voucher');
    expect(result.discountAmount).toBe(10000);
    expect(result.code).toBe('SAVE10');
  });

  test('validateCode throws ValidationError if voucher is expired', async () => {
    const voucher = {
      id: 'v1',
      code: 'SAVE10',
      discountAmount: 10000,
      minOrderAmount: 30000,
      expiresAt: new Date(Date.now() - 1000000), // expired
      remainingUsage: 5,
    };
    dbState.addSelect([voucher]);

    expect(DiscountsService.validateCode('SAVE10', 50000)).rejects.toThrow(ValidationError);
  });

  test('validateCode throws ValidationError if voucher has no remaining usage', async () => {
    const voucher = {
      id: 'v1',
      code: 'SAVE10',
      discountAmount: 10000,
      minOrderAmount: 30000,
      expiresAt: new Date(Date.now() + 1000000),
      remainingUsage: 0, // no remaining usage
    };
    dbState.addSelect([voucher]);

    expect(DiscountsService.validateCode('SAVE10', 50000)).rejects.toThrow(ValidationError);
  });

  test('validateCode throws ValidationError if min order amount not met', async () => {
    const voucher = {
      id: 'v1',
      code: 'SAVE10',
      discountAmount: 10000,
      minOrderAmount: 50000, // min Rp 50.000
      expiresAt: new Date(Date.now() + 1000000),
      remainingUsage: 5,
    };
    dbState.addSelect([voucher]);

    expect(DiscountsService.validateCode('SAVE10', 30000)).rejects.toThrow(ValidationError); // subtotal 30000
  });

  test('validateCode processes percentage discount for promo', async () => {
    const promo = {
      id: 'p1',
      code: 'PROMO15',
      discountPercent: 15,
      maxDiscountAmount: 30000,
      minOrderAmount: 20000,
      expiresAt: new Date(Date.now() + 1000000),
    };
    dbState.addSelect([]); // no voucher match
    dbState.addSelect([promo]); // promo matches

    const result = await DiscountsService.validateCode('PROMO15', 100000); // 15% of 100k = 15k
    expect(result.type).toBe('promo');
    expect(result.discountAmount).toBe(15000);
  });

  test('validateCode caps percentage promo discount at maxDiscountAmount', async () => {
    const promo = {
      id: 'p1',
      code: 'PROMO15',
      discountPercent: 15,
      maxDiscountAmount: 10000, // capped at 10k
      minOrderAmount: 20000,
      expiresAt: new Date(Date.now() + 1000000),
    };
    dbState.addSelect([]); // no voucher match
    dbState.addSelect([promo]); // promo matches

    const result = await DiscountsService.validateCode('PROMO15', 100000); // 15% of 100k = 15k -> capped at 10k
    expect(result.type).toBe('promo');
    expect(result.discountAmount).toBe(10000);
  });

  test('validateCode throws NotFoundError if no discount matches code', async () => {
    dbState.addSelect([]); // no voucher match
    dbState.addSelect([]); // no promo match

    expect(DiscountsService.validateCode('XYZ', 50000)).rejects.toThrow(NotFoundError);
  });

  test('decrementVoucherUsage decrements voucher usage in transaction', async () => {
    const voucher = { id: 'v1', remainingUsage: 4 };
    dbState.addUpdate([voucher]);

    const mockTx = {
      update: () => ({
        set: () => ({
          where: () => ({
            returning: () => Promise.resolve([voucher]),
          }),
        }),
      }),
    };

    const result = await DiscountsService.decrementVoucherUsage(mockTx, 'v1');
    expect(result.id).toBe('v1');
  });
});
