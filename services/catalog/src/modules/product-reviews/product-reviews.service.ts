import { db } from '@/db';
import { products, productReviews, stores } from '@/db/schema';
import { eq, and, desc, count } from 'drizzle-orm';
import { HTTPException } from 'hono/http-exception';
import { z } from 'zod';
import { commerceClient, identityClient } from '@/modules/clients/clients.index';
import { catalogOutbox } from '@/modules/events/events.index';

const purchaseCheckSchema = z.object({ purchased: z.boolean() });
const displayNamesSchema = z.object({
  users: z.array(z.object({ id: z.string(), displayName: z.string() })),
});

export class ProductReviewsService {
  static async createReview(
    buyerId: string,
    productId: string,
    input: { rating: number; comment: string },
  ) {
    // 1. Verify with commerce (owner of orders) that the buyer completed a purchase of this product
    const { purchased } = await commerceClient.get(
      '/internal/purchases/check',
      purchaseCheckSchema,
      {
        buyerId,
        productId,
      },
    );

    if (!purchased) {
      throw new HTTPException(403, {
        message:
          'Anda harus menyelesaikan pembelian produk ini terlebih dahulu sebelum memberikan ulasan',
      });
    }

    // 2. Verify if the buyer has already submitted a review for this product
    const [existingReview] = await db
      .select({ id: productReviews.id })
      .from(productReviews)
      .where(and(eq(productReviews.productId, productId), eq(productReviews.buyerId, buyerId)))
      .limit(1);

    if (existingReview) {
      throw new HTTPException(400, {
        message: 'Anda sudah mengirimkan ulasan untuk produk ini',
      });
    }

    // 3. Snapshot the reviewer's display name from identity (owner of user profiles)
    const { users } = await identityClient.get('/internal/users', displayNamesSchema, {
      ids: [buyerId],
    });
    const reviewerName = users[0]?.displayName ?? 'Pembeli';

    // 4. Create the review and update product stats inside a transaction
    try {
      return await db.transaction(async (tx) => {
        // Row lock the product to prevent concurrent modifications issues
        const [product] = await tx
          .select({
            id: products.id,
            rating: products.rating,
            reviewCount: products.reviewCount,
            storeId: products.storeId,
          })
          .from(products)
          .where(eq(products.id, productId))
          .for('update');

        if (!product) {
          throw new HTTPException(404, { message: 'Produk tidak ditemukan' });
        }

        const oldRating = parseFloat(product.rating || '0.00');
        const oldCount = product.reviewCount || 0;
        const newRating = input.rating;

        const newCount = oldCount + 1;
        const newAvg = (oldRating * oldCount + newRating) / newCount;
        const newAvgStr = newAvg.toFixed(2);

        const [review] = await tx
          .insert(productReviews)
          .values({
            productId,
            buyerId,
            reviewerName,
            rating: newRating,
            comment: input.comment,
          })
          .returning();

        await tx
          .update(products)
          .set({
            rating: newAvgStr,
            reviewCount: newCount,
          })
          .where(eq(products.id, productId));

        // Update the store's rating and reviewCount
        const [store] = await tx
          .select({
            id: stores.id,
            rating: stores.rating,
            reviewCount: stores.reviewCount,
          })
          .from(stores)
          .where(eq(stores.id, product.storeId))
          .for('update');

        if (store) {
          const oldStoreRating = parseFloat(store.rating || '0.00');
          const oldStoreCount = store.reviewCount || 0;
          const newStoreCount = oldStoreCount + 1;
          const newStoreAvg = (oldStoreRating * oldStoreCount + newRating) / newStoreCount;
          const newStoreAvgStr = newStoreAvg.toFixed(2);

          await tx
            .update(stores)
            .set({
              rating: newStoreAvgStr,
              reviewCount: newStoreCount,
            })
            .where(eq(stores.id, store.id));
        }

        await catalogOutbox.enqueue(tx, 'product', [productId]);
        await catalogOutbox.enqueue(tx, 'store', [product.storeId]);
        return review;
      });
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'code' in error && error.code === '23505') {
        throw new HTTPException(400, {
          message: 'Anda sudah mengirimkan ulasan untuk produk ini',
        });
      }
      throw error;
    }
  }

  static async getProductReviews(productId: string, options?: { page?: number; limit?: number }) {
    const { page = 1, limit = 10 } = options ?? {};
    const offset = (page - 1) * limit;

    const countResult = await db
      .select({ count: count() })
      .from(productReviews)
      .where(eq(productReviews.productId, productId));

    const total = Number(countResult[0]?.count ?? 0);

    const reviewsList = await db
      .select({
        id: productReviews.id,
        productId: productReviews.productId,
        buyerId: productReviews.buyerId,
        rating: productReviews.rating,
        comment: productReviews.comment,
        createdAt: productReviews.createdAt,
        reviewerName: productReviews.reviewerName,
      })
      .from(productReviews)
      .where(eq(productReviews.productId, productId))
      .orderBy(desc(productReviews.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      reviews: reviewsList,
      total,
    };
  }

  static async getMyProductReviews(buyerId: string, options?: { page?: number; limit?: number }) {
    const { page = 1, limit = 10 } = options ?? {};
    const offset = (page - 1) * limit;

    const countResult = await db
      .select({ count: count() })
      .from(productReviews)
      .where(eq(productReviews.buyerId, buyerId));

    const total = Number(countResult[0]?.count ?? 0);

    const reviewsList = await db
      .select({
        id: productReviews.id,
        productId: productReviews.productId,
        buyerId: productReviews.buyerId,
        rating: productReviews.rating,
        comment: productReviews.comment,
        createdAt: productReviews.createdAt,
        reviewerName: productReviews.reviewerName,
      })
      .from(productReviews)
      .where(eq(productReviews.buyerId, buyerId))
      .orderBy(desc(productReviews.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      reviews: reviewsList,
      total,
    };
  }
}
