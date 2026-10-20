import { beforeEach, describe, expect, mock, test } from 'bun:test';
import type { EventEnvelope } from '@seapedia/platform/events';

const state = {
  store: { _id: 'store-1', sellerId: 'seller-1', slug: 'toko', version: 1 } as Record<
    string,
    unknown
  > | null,
  owned: null as Record<string, unknown> | null,
  search: null as { ids: string[]; total: number } | null,
  inOrder: [] as string[],
  listFilter: null as unknown,
  published: [] as EventEnvelope[],
  deleted: [] as string[],
};

const product = (id: string, extra: Record<string, unknown> = {}) => ({
  _id: id,
  storeId: 'store-1',
  name: 'Ikan Tuna',
  slug: 'ikan-tuna',
  description: null,
  price: 50_000,
  imageKey: null,
  rating: 0,
  reviewCount: 0,
  soldCount: 0,
  stock: 0,
  stockVersion: 0,
  version: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...extra,
});

mock.module('@/db', () => ({ inTransaction: (fn: (s: unknown) => unknown) => fn({}) }));
mock.module('@/lib/storage', () => ({
  StorageService: {
    deleteObject: async (key: string) => void state.deleted.push(key),
    generatePresignedUpload: async () => ({ uploadUrl: 'u', objectKey: 'k', publicUrl: 'p' }),
  },
}));
mock.module('@/modules/search/search.index', () => ({
  searchProductIds: async () => state.search,
}));
mock.module('@/modules/events/events.index', () => ({
  enqueue: async (_s: unknown, ...events: EventEnvelope[]) => void state.published.push(...events),
  CatalogEvents: {
    productUpserted: (p: { _id: string }) => ({
      type: 'catalog.product.upserted',
      data: { id: p._id },
    }),
    productDeleted: (p: { _id: string }) => ({
      type: 'catalog.product.deleted',
      data: { id: p._id },
    }),
    storeUpserted: (s: { _id: string }) => ({
      type: 'catalog.store.upserted',
      data: { id: s._id },
    }),
  },
}));
mock.module('@/modules/stores/stores.repo', () => ({
  StoresRepo: { bySeller: async () => state.store, findPublic: async () => state.store },
  toStore: ({ _id, ...rest }: { _id: string }) => ({ id: _id, ...rest }),
}));
mock.module('./products.repo', () => ({
  toSellerProduct: ({ _id, ...rest }: { _id: string }) => ({ id: _id, ...rest }),
  ProductsRepo: {
    slugTaken: async () => false,
    insert: async (p: unknown) => p,
    adjustStoreProductCount: async () => state.store,
    owned: async () => state.owned,
    update: async (id: string, set: object) => ({ ...product(id), ...set, version: 2 }),
    remove: async () => undefined,
    publicInOrder: async (ids: string[]) =>
      ids.filter((id) => state.inOrder.includes(id)).map((id) => ({ id })),
    textFilter: (q: string) => ({ text: q }),
    listPublic: async (filter: unknown) => {
      state.listFilter = filter;
      return { products: [{ id: 'from-db' }], total: 1 };
    },
  },
}));

import { ProductsService } from './products.service';

beforeEach(() => {
  state.store = { _id: 'store-1', sellerId: 'seller-1', slug: 'toko', version: 1 };
  state.owned = null;
  state.search = null;
  state.inOrder = [];
  state.listFilter = null;
  state.published = [];
  state.deleted = [];
});

describe('seller products', () => {
  test('creating a product publishes it and the store count change', async () => {
    const created = await ProductsService.createSellerProduct('seller-1', {
      name: 'Ikan Tuna',
      price: 50_000,
    });
    expect(created).toMatchObject({ name: 'Ikan Tuna', storeId: 'store-1', stock: 0 });
    expect(state.published.map((e) => e.type)).toEqual([
      'catalog.product.upserted',
      'catalog.store.upserted',
    ]);
  });

  test('a negative price is rejected', async () => {
    await expect(
      ProductsService.createSellerProduct('seller-1', { name: 'X', price: -1 }),
    ).rejects.toThrow('Price cannot be negative');
  });

  test('a seller without a store cannot create products', async () => {
    state.store = null;
    await expect(
      ProductsService.createSellerProduct('seller-1', { name: 'X', price: 1 }),
    ).rejects.toThrow('Store not found');
  });

  test("another store's product cannot be updated", async () => {
    await expect(
      ProductsService.updateSellerProduct('seller-1', 'p-x', { name: 'Y' }),
    ).rejects.toThrow('Product not found or does not belong to your store');
  });

  test('replacing the image deletes the old object after the update is published', async () => {
    state.owned = product('p-1', { imageKey: 'products/images/old.png' });
    await ProductsService.updateSellerProduct('seller-1', 'p-1', {
      imageKey: 'products/images/new.png',
    });
    expect(state.published.map((e) => e.type)).toEqual(['catalog.product.upserted']);
    expect(state.deleted).toEqual(['products/images/old.png']);
  });

  test('deleting a product publishes the deletion', async () => {
    state.owned = product('p-1');
    await ProductsService.deleteSellerProduct('seller-1', 'p-1');
    expect(state.published.map((e) => e.type)).toEqual([
      'catalog.product.deleted',
      'catalog.store.upserted',
    ]);
  });
});

describe('public listing', () => {
  test('keeps the ranking from the search service and its total', async () => {
    state.search = { ids: ['p-2', 'p-1', 'p-gone'], total: 7 };
    state.inOrder = ['p-1', 'p-2'];
    const result = await ProductsService.getPublicProducts({ search: 'tuna', page: 1, limit: 20 });
    expect(result.products.map((p) => p.id)).toEqual(['p-2', 'p-1']);
    expect(result.total).toBe(7);
  });

  test('falls back to the database when search is unavailable', async () => {
    state.search = null;
    const result = await ProductsService.getPublicProducts({
      search: 'tuna',
      storeSlug: 'toko',
      page: 1,
      limit: 20,
    });
    expect(result.products.map((p) => p.id)).toEqual(['from-db']);
    expect(state.listFilter).toEqual({ text: 'tuna', storeId: 'store-1' });
  });
});
