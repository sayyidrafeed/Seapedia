import { beforeEach, describe, expect, mock, test } from 'bun:test';
import type { EventEnvelope } from '@seapedia/platform/events';

const state = {
  purchased: true,
  reviewed: false,
  displayName: 'Dewi' as string | null,
  published: [] as EventEnvelope[],
  productRating: null as null | { rating: number; count: number },
};

mock.module('@/db', () => ({ inTransaction: (fn: (s: unknown) => unknown) => fn({}) }));
mock.module('@/modules/events/events.index', () => ({
  enqueue: async (_s: unknown, ...events: EventEnvelope[]) => void state.published.push(...events),
  CatalogEvents: {
    productUpserted: () => ({ type: 'catalog.product.upserted' }),
    storeUpserted: () => ({ type: 'catalog.store.upserted' }),
  },
}));
mock.module('./product-reviews.repo', () => ({
  toReview: ({ _id, ...rest }: { _id: string }) => ({ id: _id, ...rest }),
  ProductReviewsRepo: {
    hasPurchased: async () => state.purchased,
    alreadyReviewed: async () => state.reviewed,
    displayName: async () => state.displayName,
    insert: async () => undefined,
    product: async () => ({ _id: 'p-1', storeId: 's-1', rating: 4, reviewCount: 2 }),
    store: async () => ({ _id: 's-1', rating: 4, reviewCount: 2 }),
    setProductRating: async (_id: string, rating: number, count: number) => {
      state.productRating = { rating, count };
      return { _id: 'p-1' };
    },
    setStoreRating: async () => ({ _id: 's-1' }),
  },
}));

import { addToAverage, ProductReviewsService } from './product-reviews.service';

beforeEach(() => {
  state.purchased = true;
  state.reviewed = false;
  state.displayName = 'Dewi';
  state.published = [];
  state.productRating = null;
});

describe('product reviews', () => {
  test('only buyers with a completed purchase may review', async () => {
    state.purchased = false;
    await expect(
      ProductReviewsService.createReview('b-1', 'p-1', { rating: 5, comment: 'ok' }),
    ).rejects.toThrow(
      'Anda harus menyelesaikan pembelian produk ini terlebih dahulu sebelum memberikan ulasan',
    );
  });

  test('one review per buyer and product', async () => {
    state.reviewed = true;
    await expect(
      ProductReviewsService.createReview('b-1', 'p-1', { rating: 5, comment: 'ok' }),
    ).rejects.toThrow('Anda sudah mengirimkan ulasan untuk produk ini');
  });

  test('a review updates the running average and publishes product and store', async () => {
    const review = await ProductReviewsService.createReview('b-1', 'p-1', {
      rating: 5,
      comment: 'Mantap',
    });
    expect(review).toMatchObject({ reviewerName: 'Dewi', rating: 5 });
    expect(state.productRating).toEqual({ rating: 4.33, count: 3 });
    expect(state.published.map((e) => e.type)).toEqual([
      'catalog.product.upserted',
      'catalog.store.upserted',
    ]);
  });

  test('without a replicated name the reviewer shows as "Pembeli"', async () => {
    state.displayName = null;
    const review = await ProductReviewsService.createReview('b-1', 'p-1', {
      rating: 4,
      comment: 'ok',
    });
    expect(review.reviewerName).toBe('Pembeli');
  });

  test('running average', () => {
    expect(addToAverage(0, 0, 5)).toBe(5);
    expect(addToAverage(4.5, 2, 3)).toBe(4);
  });
});
