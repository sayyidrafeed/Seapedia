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
  // Any chain of from/innerJoin/where/limit/offset resolves to the next queued result.
  function makeSelect() {
    return () => {
      const data = dbState.selectQueue[dbState.selectIdx++] ?? [];
      const chain = Object.assign(Promise.resolve(data), {} as Record<string, () => unknown>);
      for (const method of ['from', 'innerJoin', 'where', 'limit', 'offset', 'orderBy']) {
        chain[method] = () => chain;
      }
      return chain;
    };
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
          return {
            returning: () => {
              dbState.updateIdx++;
              return Promise.resolve(dbState.updateQueue[idx] ?? []);
            },
          };
        },
      }),
    });
  }

  function makeDelete() {
    return () => ({
      where: () => Promise.resolve(),
    });
  }

  const findFirstFn = () => {
    return () => {
      const idx = dbState.selectIdx++;
      const data = dbState.selectQueue[idx] ?? [];
      return Promise.resolve(data[0]);
    };
  };

  const findManyFn = () => {
    return () => {
      const idx = dbState.selectIdx++;
      const data = dbState.selectQueue[idx] ?? [];
      return Promise.resolve(data);
    };
  };

  const db = {
    query: {
      products: {
        findFirst: findFirstFn(),
        findMany: findManyFn(),
      },
      stores: {
        findFirst: findFirstFn(),
      },
    },
    select: makeSelect(),
    insert: makeInsert(),
    update: makeUpdate(),
    delete: makeDelete(),
    transaction: async (fn: (tx: unknown) => Promise<unknown>) => {
      return await fn(db);
    },
  };

  return { db };
});

const storageState = {
  deleteCalls: [] as string[],
  reset() {
    this.deleteCalls = [];
  },
};

mock.module('@/lib/storage', () => {
  return {
    StorageService: {
      generatePresignedUpload: (prefix: string, _mimeType: string) => {
        return Promise.resolve({
          uploadUrl: `https://r2-mock.com/${prefix}/file.png`,
          objectKey: `${prefix}/file.png`,
          publicUrl: `https://cdn.mock.com/${prefix}/file.png`,
        });
      },
      deleteObject: (key: string) => {
        storageState.deleteCalls.push(key);
        return Promise.resolve();
      },
      getPublicUrl: (key: string) => {
        return `https://cdn.mock.com/${key}`;
      },
    },
  };
});

const searchState = {
  result: null as { ids: string[]; total: number } | null,
};

mock.module('@/modules/search/search.index', () => ({
  searchProductIds: () => Promise.resolve(searchState.result),
}));

mock.module('@/modules/events/events.index', () => ({
  catalogOutbox: { enqueue: () => Promise.resolve() },
}));

import { ProductsService } from './products.service';

const makeStore = (overrides: Record<string, unknown> = {}) => ({
  id: 'store-1',
  sellerId: 'seller-1',
  name: 'Seller Store',
  description: 'Desc',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

const makeProduct = (overrides: Record<string, unknown> = {}) => ({
  id: 'prod-1',
  storeId: 'store-1',
  name: 'Product Name',
  description: 'Product Desc',
  price: 100000,
  stock: 10,
  imageKey: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe('ProductsService', () => {
  beforeEach(() => {
    dbState.reset();
    storageState.reset();
  });

  describe('createSellerProduct', () => {
    test('creates product under seller store', async () => {
      dbState.addSelect([makeStore()]); // StoreService.getBySellerId
      dbState.addInsert([makeProduct()]); // Products insert

      const result = await ProductsService.createSellerProduct('seller-1', {
        name: 'Product Name',
        description: 'Product Desc',
        price: 100000,
      });

      expect(result.id).toBe('prod-1');
      expect(result.storeId).toBe('store-1');
    });

    test('throws error if seller has no store', async () => {
      dbState.addSelect([]); // StoreService.getBySellerId returns null/undefined -> throws Store not found

      await expect(
        ProductsService.createSellerProduct('seller-1', {
          name: 'Product Name',
          price: 100000,
        }),
      ).rejects.toThrow('Store not found');
    });

    test('throws ValidationError if price is negative', async () => {
      dbState.addSelect([makeStore()]); // StoreService.getBySellerId

      await expect(
        ProductsService.createSellerProduct('seller-1', {
          name: 'Product Name',
          price: -100,
        }),
      ).rejects.toThrow('Price cannot be negative');
    });
  });

  describe('getSellerProducts', () => {
    test('returns seller products list', async () => {
      dbState.addSelect([makeStore()]); // StoreService.getBySellerId
      dbState.addSelect([{ count: 2 }]); // db.select count(*)
      dbState.addSelect([makeProduct(), makeProduct({ id: 'prod-2' })]); // findMany products

      const result = await ProductsService.getSellerProducts('seller-1');

      expect(result.total).toBe(2);
      expect(result.products.length).toBe(2);
      expect(result.products[0].id).toBe('prod-1');
      expect(result.products[1].id).toBe('prod-2');
    });
  });

  describe('getSellerProductById', () => {
    test('returns seller product by id', async () => {
      dbState.addSelect([makeStore()]); // StoreService.getBySellerId
      dbState.addSelect([makeProduct()]); // findFirst product

      const result = await ProductsService.getSellerProductById('seller-1', 'prod-1');

      expect(result.id).toBe('prod-1');
    });

    test('throws NotFoundError if product not found', async () => {
      dbState.addSelect([makeStore()]); // StoreService.getBySellerId
      dbState.addSelect([]); // findFirst product returns null

      await expect(ProductsService.getSellerProductById('seller-1', 'prod-1')).rejects.toThrow(
        'Product not found or does not belong to your store',
      );
    });
  });

  describe('updateSellerProduct', () => {
    test('updates product successfully', async () => {
      dbState.addSelect([makeStore()]); // StoreService.getBySellerId
      dbState.addSelect([makeProduct()]); // products.findFirst
      dbState.addUpdate([makeProduct({ name: 'Updated Product Name' })]); // update products

      const result = await ProductsService.updateSellerProduct('seller-1', 'prod-1', {
        name: 'Updated Product Name',
      });

      expect(result.name).toBe('Updated Product Name');
    });

    test('updates imageKey and deletes old product image', async () => {
      dbState.addSelect([makeStore()]); // StoreService.getBySellerId
      dbState.addSelect([makeProduct({ imageKey: 'products/images/old.png' })]); // products.findFirst
      dbState.addUpdate([makeProduct({ imageKey: 'products/images/new.png' })]); // update products

      const result = await ProductsService.updateSellerProduct('seller-1', 'prod-1', {
        imageKey: 'products/images/new.png',
      });

      expect(result.imageKey).toBe('products/images/new.png');
      expect(storageState.deleteCalls).toContain('products/images/old.png');
    });

    test('throws NotFoundError if product is not found or from other store', async () => {
      dbState.addSelect([makeStore()]); // StoreService.getBySellerId
      dbState.addSelect([]); // products.findFirst returns null

      await expect(
        ProductsService.updateSellerProduct('seller-1', 'prod-1', {
          name: 'Updated Product Name',
        }),
      ).rejects.toThrow('Product not found or does not belong to your store');
    });
  });

  describe('deleteSellerProduct', () => {
    test('deletes product successfully and deletes its image from R2', async () => {
      dbState.addSelect([makeStore()]); // StoreService.getBySellerId
      dbState.addSelect([makeProduct({ imageKey: 'products/images/to-delete.png' })]); // products.findFirst

      const result = await ProductsService.deleteSellerProduct('seller-1', 'prod-1');

      expect(result.success).toBe(true);
      expect(storageState.deleteCalls).toContain('products/images/to-delete.png');
    });
  });

  describe('getPublicProducts', () => {
    beforeEach(() => {
      searchState.result = null;
    });

    test('keeps the ranking from the search service and its total', async () => {
      searchState.result = { ids: ['prod-2', 'prod-1', 'prod-gone'], total: 7 };
      // Hydration returns rows in database order; deleted products are simply missing.
      dbState.addSelect([makeProduct({ id: 'prod-1' }), makeProduct({ id: 'prod-2' })]);

      const result = await ProductsService.getPublicProducts({
        search: 'ikan',
        page: 1,
        limit: 20,
      });

      expect(result.products.map((p) => p.id)).toEqual(['prod-2', 'prod-1']);
      expect(result.total).toBe(7);
    });

    test('falls back to the database query when search is unavailable', async () => {
      searchState.result = null;
      dbState.addSelect([{ count: 1 }]); // count
      dbState.addSelect([makeProduct({ id: 'prod-db' })]); // rows

      const result = await ProductsService.getPublicProducts({
        search: 'ikan',
        page: 1,
        limit: 20,
      });

      expect(result.products.map((p) => p.id)).toEqual(['prod-db']);
      expect(result.total).toBe(1);
    });
  });

  describe('presignImage', () => {
    test('generates presigned product image URL successfully', async () => {
      dbState.addSelect([makeStore()]);
      const result = await ProductsService.presignImage('seller-1', 'image/png');
      expect(result.uploadUrl).toBe('https://r2-mock.com/products/images/file.png');
      expect(result.objectKey).toBe('products/images/file.png');
    });

    test('throws ForbiddenError if seller has no store', async () => {
      dbState.addSelect([]); // no store
      await expect(ProductsService.presignImage('seller-1', 'image/png')).rejects.toThrow(
        'Store not found',
      );
    });
  });
});
