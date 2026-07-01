import { db } from '@/db';
import { orders, orderItems, products, productReviews, users } from '@/db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { HTTPException } from 'hono/http-exception';

export class ProductReviewsService {
  static async createReview(
    buyerId: string,
    productId: string,
    input: { rating: number; comment: string },
  ) {
    // 1. Verify that the buyer purchased this product and the order status is completed ('pesanan_selesai')
    const purchased = await db
      .select({ id: orders.id })
      .from(orders)
      .innerJoin(orderItems, eq(orders.id, orderItems.orderId))
      .where(
        and(
          eq(orders.buyerId, buyerId),
          eq(orderItems.productId, productId),
          eq(orders.status, 'pesanan_selesai'),
        ),
      )
      .limit(1);

    if (purchased.length === 0) {
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

    // 3. Create the review and update product stats inside a transaction
    return await db.transaction(async (tx) => {
      // Row lock the product to prevent concurrent modifications issues
      const [product] = await tx
        .select({
          id: products.id,
          rating: products.rating,
          reviewCount: products.reviewCount,
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

      return {
        ...review,
        reviewerName: '', // Filled in the controller or query resolver if needed
      };
    });
  }

  static async getProductReviews(productId: string, options?: { page?: number; limit?: number }) {
    const { page = 1, limit = 10 } = options ?? {};
    const offset = (page - 1) * limit;

    const countResult = await db
      .select({ count: sql<number>`count(*)` })
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
        reviewerName: users.name,
      })
      .from(productReviews)
      .innerJoin(users, eq(productReviews.buyerId, users.id))
      .where(eq(productReviews.productId, productId))
      .orderBy(desc(productReviews.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      reviews: reviewsList,
      total,
    };
  }

  static async getMyProductReviews(buyerId: string) {
    const reviewsList = await db
      .select({
        id: productReviews.id,
        productId: productReviews.productId,
        buyerId: productReviews.buyerId,
        rating: productReviews.rating,
        comment: productReviews.comment,
        createdAt: productReviews.createdAt,
        reviewerName: users.name,
      })
      .from(productReviews)
      .innerJoin(users, eq(productReviews.buyerId, users.id))
      .where(eq(productReviews.buyerId, buyerId))
      .orderBy(desc(productReviews.createdAt));

    return {
      reviews: reviewsList,
    };
  }
}
