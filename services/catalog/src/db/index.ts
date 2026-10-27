import { MongoClient, type ClientSession } from 'mongodb';
import type { EventEnvelope } from '@seapedia/platform/events';
import { env } from '@/env';

export type StoreDoc = {
  _id: string;
  sellerId: string;
  name: string;
  slug: string;
  description: string | null;
  logoKey: string | null;
  rating: number;
  reviewCount: number;
  totalProducts: number;
  version: number;
  createdAt: Date;
  updatedAt: Date;
};

export type ProductDoc = {
  _id: string;
  storeId: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  imageKey: string | null;
  rating: number;
  reviewCount: number;
  soldCount: number;
  // Read model of commerce inventory, applied from `commerce.inventory.changed`.
  stock: number;
  stockVersion: number;
  version: number;
  createdAt: Date;
  updatedAt: Date;
};

export type ProductReviewDoc = {
  _id: string;
  productId: string;
  buyerId: string;
  // Snapshot of the buyer's display name when the review was written.
  reviewerName: string;
  rating: number;
  comment: string;
  createdAt: Date;
};

export type AppReviewDoc = {
  _id: string;
  reviewerName: string;
  rating: number;
  comment: string;
  createdAt: Date;
};

// Replica of identity users (display names), from `identity.user.*`.
export type UserRefDoc = { _id: string; displayName: string; version: number };

// Completed purchases from `commerce.order.completed`: the review gate. `_id` = buyerId:productId.
export type PurchaseDoc = { _id: string; buyerId: string; productId: string; at: Date };

export type OutboxDoc = {
  _id: string;
  type: string;
  payload: EventEnvelope;
  createdAt: Date;
  publishedAt: Date | null;
};
export type InboxDoc = { _id: string; type: string; processedAt: Date };

export const mongo = new MongoClient(env.MONGODB_URL, { serverSelectionTimeoutMS: 5000 });
const database = mongo.db();

export const collections = {
  stores: database.collection<StoreDoc>('stores'),
  products: database.collection<ProductDoc>('products'),
  productReviews: database.collection<ProductReviewDoc>('product_reviews'),
  appReviews: database.collection<AppReviewDoc>('app_reviews'),
  users: database.collection<UserRefDoc>('users'),
  purchases: database.collection<PurchaseDoc>('purchases'),
  outbox: database.collection<OutboxDoc>('outbox'),
  inbox: database.collection<InboxDoc>('inbox'),
};

// Multi-document transaction (catalog-db runs as a single-node replica set for this).
export async function inTransaction<T>(work: (session: ClientSession) => Promise<T>): Promise<T> {
  const session = mongo.startSession();
  try {
    return await session.withTransaction(() => work(session));
  } finally {
    await session.endSession();
  }
}
