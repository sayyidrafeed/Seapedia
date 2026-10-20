import { beforeEach, describe, expect, mock, test } from 'bun:test';
import type { EventEnvelope } from '@seapedia/platform/events';

const state = {
  bySeller: null as Record<string, unknown> | null,
  nameTaken: false,
  published: [] as EventEnvelope[],
  deleted: [] as string[],
};

const storeDoc = (extra: Record<string, unknown> = {}) => ({
  _id: 'store-1',
  sellerId: 'seller-1',
  name: 'Toko Laut',
  slug: 'toko-laut',
  description: null,
  logoKey: null,
  rating: 0,
  reviewCount: 0,
  totalProducts: 0,
  version: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...extra,
});

mock.module('@/db', () => ({ inTransaction: (fn: (s: unknown) => unknown) => fn({}) }));
mock.module('@/lib/storage', () => ({
  StorageService: { deleteObject: async (key: string) => void state.deleted.push(key) },
}));
mock.module('@/modules/events/events.index', () => ({
  enqueue: async (_s: unknown, ...events: EventEnvelope[]) => void state.published.push(...events),
  CatalogEvents: {
    storeUpserted: (s: { _id: string }) => ({
      type: 'catalog.store.upserted',
      data: { id: s._id },
    }),
  },
}));
mock.module('./stores.repo', () => ({
  toStore: ({ _id, ...rest }: { _id: string }) => ({ id: _id, ...rest }),
  StoresRepo: {
    bySeller: async () => state.bySeller,
    nameTaken: async () => state.nameTaken,
    slugTaken: async () => false,
    insert: async (doc: unknown) => doc,
    update: async (_id: string, set: object) => storeDoc({ ...set, version: 2 }),
  },
}));

import { StoreService } from './stores.service';

beforeEach(() => {
  state.bySeller = null;
  state.nameTaken = false;
  state.published = [];
  state.deleted = [];
});

describe('stores', () => {
  test('a seller can open one store, and it is published', async () => {
    const store = await StoreService.create('seller-1', { name: 'Toko Laut' });
    expect(store).toMatchObject({ sellerId: 'seller-1', slug: 'toko-laut' });
    expect(state.published.map((e) => e.type)).toEqual(['catalog.store.upserted']);
  });

  test('a second store for the same seller is refused', async () => {
    state.bySeller = storeDoc();
    await expect(StoreService.create('seller-1', { name: 'Lain' })).rejects.toThrow(
      'Seller already has a store',
    );
  });

  test('store names are unique', async () => {
    state.nameTaken = true;
    await expect(StoreService.create('seller-1', { name: 'Toko Laut' })).rejects.toThrow(
      'Store name is already used',
    );
  });

  test('renaming publishes the change and replacing the logo deletes the old one', async () => {
    state.bySeller = storeDoc({ logoKey: 'stores/logos/old.png' });
    const updated = await StoreService.update('seller-1', {
      name: 'Toko Baru',
      logoKey: 'stores/logos/new.png',
    });
    expect(updated).toMatchObject({ name: 'Toko Baru', slug: 'toko-baru' });
    expect(state.published.map((e) => e.type)).toEqual(['catalog.store.upserted']);
    expect(state.deleted).toEqual(['stores/logos/old.png']);
  });
});
