import { HTTPException } from 'hono/http-exception';
import { inTransaction } from '@/db';
import { CatalogEvents, enqueue } from '@/modules/events/events.index';
import { ProductReviewsRepo, toReview } from './product-reviews.repo';

/** Running average after adding one rating. */
export const addToAverage = (average: number, count: number, rating: number) =>
  Number(((average * count + rating) / (count + 1)).toFixed(2));

export class ProductReviewsService {
  static async createReview(
    buyerId: string,
    productId: string,
    input: { rating: number; comment: string },
  ) {
    // Purchases are replicated from commerce's `order.completed` events: no call to commerce.
    if (!(await ProductReviewsRepo.hasPurchased(buyerId, productId))) {
      throw new HTTPException(403, {
        message:
          'Anda harus menyelesaikan pembelian produk ini terlebih dahulu sebelum memberikan ulasan',
      });
    }

    if (await ProductReviewsRepo.alreadyReviewed(buyerId, productId)) {
      throw new HTTPException(400, { message: 'Anda sudah mengirimkan ulasan untuk produk ini' });
    }

    // Display names are replicated from identity's `user.*` events.
    const reviewerName = (await ProductReviewsRepo.displayName(buyerId)) ?? 'Pembeli';

    return await inTransaction(async (session) => {
      const product = await ProductReviewsRepo.product(productId, session);
      if (!product) {
        throw new HTTPException(404, { message: 'Produk tidak ditemukan' });
      }

      const review = {
        _id: crypto.randomUUID(),
        productId,
        buyerId,
        reviewerName,
        rating: input.rating,
        comment: input.comment,
        createdAt: new Date(),
      };
      await ProductReviewsRepo.insert(review, session);

      const updatedProduct = await ProductReviewsRepo.setProductRating(
        productId,
        addToAverage(product.rating, product.reviewCount, input.rating),
        product.reviewCount + 1,
        session,
      );
      const store = await ProductReviewsRepo.store(product.storeId, session);
      const updatedStore = store
        ? await ProductReviewsRepo.setStoreRating(
            store._id,
            addToAverage(store.rating, store.reviewCount, input.rating),
            store.reviewCount + 1,
            session,
          )
        : null;

      if (updatedProduct) await enqueue(session, CatalogEvents.productUpserted(updatedProduct));
      if (updatedStore) await enqueue(session, CatalogEvents.storeUpserted(updatedStore));
      return toReview(review);
    });
  }

  static async getProductReviews(productId: string, options?: { page?: number; limit?: number }) {
    const [total, docs] = await ProductReviewsRepo.page(
      { productId },
      options?.page ?? 1,
      options?.limit ?? 10,
    );
    return { reviews: docs.map(toReview), total };
  }

  static async getMyProductReviews(buyerId: string, options?: { page?: number; limit?: number }) {
    const [total, docs] = await ProductReviewsRepo.page(
      { buyerId },
      options?.page ?? 1,
      options?.limit ?? 10,
    );
    return { reviews: docs.map(toReview), total };
  }
}
