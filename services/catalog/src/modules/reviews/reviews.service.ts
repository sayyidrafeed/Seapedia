import { db } from '@/db';
import { appReview } from '@/db/schema';
import { desc, sql } from 'drizzle-orm';

export class ReviewsService {
  static async createReview(input: { reviewerName: string; rating: number; comment: string }) {
    const [newReview] = await db
      .insert(appReview)
      .values({
        reviewerName: input.reviewerName,
        rating: input.rating,
        comment: input.comment,
      })
      .returning();

    return newReview;
  }

  static async listReviews(pagination?: { limit: number; offset: number }) {
    const query = db.select().from(appReview).orderBy(desc(appReview.createdAt));
    if (pagination) {
      return await query.limit(pagination.limit).offset(pagination.offset);
    }
    return await query;
  }

  static async getReviewsStats() {
    const [stats] = await db
      .select({
        totalReviews: sql<number>`cast(count(${appReview.id}) as int)`,
        averageRating: sql<number>`coalesce(cast(avg(${appReview.rating}) as float), 0)`,
      })
      .from(appReview);
    return stats || { totalReviews: 0, averageRating: 0.0 };
  }
}
