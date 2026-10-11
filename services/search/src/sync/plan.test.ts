import { describe, expect, test } from 'bun:test';
import type { OutboxEvent } from '@seapedia/platform/outbox';
import type { ProductDocument } from '@/elastic/documents';
import { idsToFetch, planSync } from './plan';

const P1 = '00000000-0000-4000-8000-000000000001';
const P2 = '00000000-0000-4000-8000-000000000002';
const STORE = '00000000-0000-4000-8000-0000000000aa';

let nextId = 1;
const event = (topic: string, entityId: string): OutboxEvent => ({ id: nextId++, topic, entityId });

const doc = (id: string, overrides: Partial<ProductDocument> = {}): ProductDocument => ({
  id,
  name: 'Ikan Tongkol',
  description: null,
  slug: 'ikan-tongkol',
  rating: 4.5,
  reviewCount: 2,
  soldCount: 10,
  createdAt: '2026-10-01T00:00:00.000Z',
  storeId: STORE,
  storeName: 'Toko Laut',
  storeSlug: 'toko-laut',
  ...overrides,
});

describe('planSync', () => {
  test('a product catalog no longer returns is deleted from the index', () => {
    const plan = planSync([event('product', P1)], []);
    expect(plan).toEqual({ upserts: [], deletes: [P1] });
  });

  test('a store event re-indexes every product catalog returns for that store', () => {
    const events = [event('store', STORE)];
    expect(idsToFetch(events)).toEqual({ productIds: [], storeIds: [STORE] });

    const renamed = [doc(P1, { storeName: 'Toko Baru' }), doc(P2, { storeName: 'Toko Baru' })];
    const plan = planSync(events, renamed);
    expect(plan.upserts.map((d) => d.id)).toEqual([P1, P2]);
    expect(plan.deletes).toEqual([]);
  });

  test('repeated events for the same product collapse into one write', () => {
    const events = [event('product', P1), event('product', P1), event('store', STORE)];
    expect(idsToFetch(events)).toEqual({ productIds: [P1], storeIds: [STORE] });

    // Catalog returns P1 once for the product id and once more for the store.
    const plan = planSync(events, [doc(P1), doc(P1)]);
    expect(plan.upserts).toHaveLength(1);
    expect(plan.deletes).toEqual([]);
  });
});
