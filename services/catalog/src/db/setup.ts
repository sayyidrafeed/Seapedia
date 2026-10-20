import { collections, mongo } from './index';

const caseInsensitive = { locale: 'en', strength: 2 } as const;

/**
 * Indexes that enforce catalog's invariants. Idempotent; runs on every start instead of
 * migrations (MongoDB has no schema migrations, the documents are typed in db/index.ts).
 */
export async function setupDatabase() {
  await mongo.connect();
  await Promise.all([
    collections.stores.createIndex({ sellerId: 1 }, { unique: true }),
    collections.stores.createIndex({ slug: 1 }, { unique: true }),
    collections.stores.createIndex({ name: 1 }, { unique: true, collation: caseInsensitive }),
    collections.products.createIndex({ storeId: 1, slug: 1 }, { unique: true }),
    collections.productReviews.createIndex({ productId: 1, buyerId: 1 }, { unique: true }),
    collections.productReviews.createIndex({ productId: 1, createdAt: -1 }),
    collections.productReviews.createIndex({ buyerId: 1, createdAt: -1 }),
    collections.appReviews.createIndex({ createdAt: -1 }),
    collections.outbox.createIndex({ publishedAt: 1, createdAt: 1 }),
    collections.outbox.createIndex({ publishedAt: 1 }, { expireAfterSeconds: 7 * 86_400 }),
    collections.inbox.createIndex({ processedAt: 1 }, { expireAfterSeconds: 30 * 86_400 }),
  ]);
}
