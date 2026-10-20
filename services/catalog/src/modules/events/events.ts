import type { ClientSession } from 'mongodb';
import { createEvent, type EventEnvelope, type OutboxStore } from '@seapedia/platform/events';
import { collections, type ProductDoc, type StoreDoc } from '@/db';

/** Written in the same transaction as the change; published by the relay. */
export async function enqueue(session: ClientSession, ...events: EventEnvelope[]) {
  if (events.length === 0) return;
  await collections.outbox.insertMany(
    events.map((e) => ({
      _id: e.id,
      type: e.type,
      payload: e,
      createdAt: new Date(),
      publishedAt: null,
    })),
    { session },
  );
}

export const outboxStore: OutboxStore = {
  async pending(limit) {
    const docs = await collections.outbox
      .find({ publishedAt: null })
      .sort({ createdAt: 1 })
      .limit(limit)
      .toArray();
    return docs.map((d) => d.payload);
  },
  async markPublished(ids) {
    await collections.outbox.updateMany(
      { _id: { $in: ids } },
      { $set: { publishedAt: new Date() } },
    );
  },
};

export type StoreEventData = {
  id: string;
  sellerId: string;
  name: string;
  slug: string;
  logoKey: string | null;
  rating: number;
  reviewCount: number;
  totalProducts: number;
};

export type ProductEventData = {
  id: string;
  storeId: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  imageKey: string | null;
  rating: number;
  reviewCount: number;
  soldCount: number;
  createdAt: string;
};

export const CatalogEvents = {
  storeUpserted(store: StoreDoc) {
    return createEvent<StoreEventData>(
      'catalog',
      'catalog.store.upserted',
      {
        id: store._id,
        sellerId: store.sellerId,
        name: store.name,
        slug: store.slug,
        logoKey: store.logoKey,
        rating: store.rating,
        reviewCount: store.reviewCount,
        totalProducts: store.totalProducts,
      },
      store.version,
    );
  },
  productUpserted(product: ProductDoc) {
    return createEvent<ProductEventData>(
      'catalog',
      'catalog.product.upserted',
      {
        id: product._id,
        storeId: product.storeId,
        name: product.name,
        slug: product.slug,
        description: product.description,
        price: product.price,
        imageKey: product.imageKey,
        rating: product.rating,
        reviewCount: product.reviewCount,
        soldCount: product.soldCount,
        createdAt: product.createdAt.toISOString(),
      },
      product.version,
    );
  },
  productDeleted(product: ProductDoc) {
    return createEvent(
      'catalog',
      'catalog.product.deleted',
      { id: product._id },
      product.version + 1,
    );
  },
};
