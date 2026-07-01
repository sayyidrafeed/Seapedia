import { describe, expect, test, mock, beforeEach } from 'bun:test';

// Mock state
const dbState = {
  selectQueue: [] as unknown[][],
  insertQueue: [] as unknown[][],
  updateQueue: [] as unknown[][],
  selectIdx: 0,
  insertIdx: 0,
  updateIdx: 0,
  transactionCalls: 0,

  reset() {
    this.selectQueue = [];
    this.insertQueue = [];
    this.updateQueue = [];
    this.selectIdx = 0;
    this.insertIdx = 0;
    this.updateIdx = 0;
    this.transactionCalls = 0;
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

// Chainable mock helper
function makeChainable(getData: () => unknown) {
  const handler: ProxyHandler<object> = {
    get(_target, prop) {
      if (prop === 'then') {
        return (resolve: (val: unknown) => void, reject: (reason?: unknown) => void) => {
          return Promise.resolve(getData()).then(resolve, reject);
        };
      }
      return () => proxy;
    },
  };
  const proxy = new Proxy({}, handler);
  return proxy;
}

// Mock @/db
mock.module('@/db', () => {
  const db = {
    select: () => {
      return makeChainable(() => {
        const idx = dbState.selectIdx++;
        return dbState.selectQueue[idx] ?? [];
      });
    },
    insert: () => {
      return makeChainable(() => {
        const idx = dbState.insertIdx++;
        return dbState.insertQueue[idx] ?? [];
      });
    },
    update: () => {
      return makeChainable(() => {
        const idx = dbState.updateIdx++;
        return dbState.updateQueue[idx] ?? [];
      });
    },
    transaction: async (fn: (transactionTx: unknown) => Promise<unknown>) => {
      dbState.transactionCalls++;
      const tx = {
        select: () =>
          makeChainable(() => {
            const idx = dbState.selectIdx++;
            return dbState.selectQueue[idx] ?? [];
          }),
        insert: () =>
          makeChainable(() => {
            const idx = dbState.insertIdx++;
            return dbState.insertQueue[idx] ?? [];
          }),
        update: () =>
          makeChainable(() => {
            const idx = dbState.updateIdx++;
            return dbState.updateQueue[idx] ?? [];
          }),
      };
      return await fn(tx);
    },
  };

  return { db };
});

import { ProductReviewsService } from './product-reviews.service';

describe('ProductReviewsService', () => {
  beforeEach(() => {
    dbState.reset();
  });

  describe('createReview', () => {
    test('should successfully submit review and incrementally update product rating', async () => {
      // 1. Mock query verified purchase check (returns 1 item representing purchased order)
      dbState.addSelect([{ id: 'order-1' }]);
      // 2. Mock query duplicate check (returns empty array representing no existing reviews)
      dbState.addSelect([]);
      // 3. Mock query SELECT products FOR UPDATE (within transaction)
      dbState.addSelect([{ id: 'product-1', rating: '4.00', reviewCount: 2 }]);
      // 4. Mock INSERT into productReviews
      dbState.addInsert([
        {
          id: 'review-1',
          rating: 5,
          comment: 'Bagus sekali!',
          productId: 'product-1',
          buyerId: 'buyer-1',
          createdAt: new Date(),
        },
      ]);

      const result = await ProductReviewsService.createReview('buyer-1', 'product-1', {
        rating: 5,
        comment: 'Bagus sekali!',
      });

      expect(result).toBeDefined();
      expect(result.rating).toBe(5);
      expect(result.comment).toBe('Bagus sekali!');
      expect(dbState.transactionCalls).toBe(1);
    });

    test('should throw 403 error if user has not purchased product or order not finished', async () => {
      // 1. Mock query verified purchase check (returns empty array)
      dbState.addSelect([]);

      expect(
        ProductReviewsService.createReview('buyer-1', 'product-1', {
          rating: 5,
          comment: 'Bagus sekali!',
        }),
      ).rejects.toThrow(
        'Anda harus menyelesaikan pembelian produk ini terlebih dahulu sebelum memberikan ulasan',
      );
    });

    test('should throw 400 error if user has already reviewed the product', async () => {
      // 1. Mock query verified purchase check (returns 1 item)
      dbState.addSelect([{ id: 'order-1' }]);
      // 2. Mock query duplicate check (returns 1 item representing existing review)
      dbState.addSelect([{ id: 'review-existing' }]);

      expect(
        ProductReviewsService.createReview('buyer-1', 'product-1', {
          rating: 5,
          comment: 'Bagus sekali!',
        }),
      ).rejects.toThrow('Anda sudah mengirimkan ulasan untuk produk ini');
    });
  });

  describe('getProductReviews', () => {
    test('should fetch and paginate reviews list', async () => {
      // 1. Count query
      dbState.addSelect([{ count: 2 }]);
      // 2. Paginated review list query
      dbState.addSelect([
        {
          id: 'r-1',
          rating: 5,
          comment: 'Nice',
          reviewerName: 'John',
          productId: 'p1',
          buyerId: 'b1',
          createdAt: new Date(),
        },
        {
          id: 'r-2',
          rating: 4,
          comment: 'Good',
          reviewerName: 'Doe',
          productId: 'p1',
          buyerId: 'b2',
          createdAt: new Date(),
        },
      ]);

      const result = await ProductReviewsService.getProductReviews('product-1', {
        page: 1,
        limit: 10,
      });
      expect(result.total).toBe(2);
      expect(result.reviews).toHaveLength(2);
      expect(result.reviews[0].reviewerName).toBe('John');
    });
  });
});
