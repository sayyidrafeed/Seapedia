import type { ClientSession } from 'mongodb';
import { collections, type ProductReviewDoc } from '@/db';

export const toReview = ({ _id, ...rest }: ProductReviewDoc) => ({ id: _id, ...rest });

export const ProductReviewsRepo = {
  hasPurchased: async (buyerId: string, productId: string) =>
    (await collections.purchases.countDocuments({ _id: `${buyerId}:${productId}` })) > 0,
  displayName: async (userId: string) =>
    (await collections.users.findOne({ _id: userId }))?.displayName ?? null,
  alreadyReviewed: async (buyerId: string, productId: string) =>
    (await collections.productReviews.countDocuments({ productId, buyerId })) > 0,

  insert: (review: ProductReviewDoc, session: ClientSession) =>
    collections.productReviews.insertOne(review, { session }),
  product: (id: string, session: ClientSession) =>
    collections.products.findOne({ _id: id }, { session }),
  store: (id: string, session: ClientSession) =>
    collections.stores.findOne({ _id: id }, { session }),
  setProductRating: (id: string, rating: number, reviewCount: number, session: ClientSession) =>
    collections.products.findOneAndUpdate(
      { _id: id },
      { $set: { rating, reviewCount, updatedAt: new Date() }, $inc: { version: 1 } },
      { session, returnDocument: 'after' },
    ),
  setStoreRating: (id: string, rating: number, reviewCount: number, session: ClientSession) =>
    collections.stores.findOneAndUpdate(
      { _id: id },
      { $set: { rating, reviewCount, updatedAt: new Date() }, $inc: { version: 1 } },
      { session, returnDocument: 'after' },
    ),

  page: (
    filter: Partial<Pick<ProductReviewDoc, 'productId' | 'buyerId'>>,
    page: number,
    limit: number,
  ) =>
    Promise.all([
      collections.productReviews.countDocuments(filter),
      collections.productReviews
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .toArray(),
    ]),
};
