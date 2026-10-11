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

// Peers: commerce answers the proof-of-purchase check, identity the display name.
const peerState = { purchased: true };

mock.module('@/modules/clients/clients.index', () => ({
  commerceClient: { get: () => Promise.resolve({ purchased: peerState.purchased }) },
  identityClient: {
    get: () => Promise.resolve({ users: [{ id: 'buyer-1', displayName: 'John Doe' }] }),
  },
}));

mock.module('@/modules/events/events.index', () => ({
  catalogOutbox: { enqueue: () => Promise.resolve() },
}));

import { ProductReviewsService } from './product-reviews.service';

describe('ProductReviewsService', () => {
  beforeEach(() => {
    dbState.reset();
    peerState.purchased = true;
  });

  describe('createReview', () => {
    test('should successfully submit review and incrementally update product rating', async () => {
      // 1. Duplicate check (returns empty array representing no existing reviews)
      dbState.addSelect([]);
      // 3. Mock query SELECT products FOR UPDATE (within transaction)
      dbState.addSelect([{ id: 'product-1', rating: '4.00', reviewCount: 2, storeId: 'store-1' }]);
      // 4. Mock INSERT into productReviews
      dbState.addInsert([
        {
          id: 'review-1',
          rating: 5,
          comment: 'Bagus sekali!',
          productId: 'product-1',
          buyerId: 'buyer-1',
          reviewerName: 'John Doe',
          createdAt: new Date(),
        },
      ]);
      // 5. Mock SELECT stores FOR UPDATE
      dbState.addSelect([{ id: 'store-1', rating: '4.00', reviewCount: 2 }]);

      const result = await ProductReviewsService.createReview('buyer-1', 'product-1', {
        rating: 5,
        comment: 'Bagus sekali!',
      });

      expect(result).toBeDefined();
      expect(result.rating).toBe(5);
      expect(result.comment).toBe('Bagus sekali!');
      expect(result.reviewerName).toBe('John Doe');
      expect(dbState.transactionCalls).toBe(1);
    });

    test('should throw 403 error if user has not purchased product or order not finished', async () => {
      peerState.purchased = false;

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
      // 1. Duplicate check (returns 1 item representing existing review)
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

  describe('getMyProductReviews', () => {
    test('should fetch and paginate user own reviews list', async () => {
      // 1. Count query for user reviews
      dbState.addSelect([{ count: 1 }]);
      // 3. Paginated list query
      dbState.addSelect([
        {
          id: 'r-1',
          rating: 5,
          comment: 'Perfect product',
          productId: 'p1',
          buyerId: 'b1',
          reviewerName: 'John Doe',
          createdAt: new Date(),
        },
      ]);

      const result = await ProductReviewsService.getMyProductReviews('b1', {
        page: 1,
        limit: 5,
      });
      expect(result.total).toBe(1);
      expect(result.reviews).toHaveLength(1);
      expect(result.reviews[0].reviewerName).toBe('John Doe');
      expect(result.reviews[0].comment).toBe('Perfect product');
    });
  });
});
