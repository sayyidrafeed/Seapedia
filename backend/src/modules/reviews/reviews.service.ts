import { db } from '@/db';
import { appReview } from '@/db/schema';
import { desc } from 'drizzle-orm';

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

  static async listReviews() {
    return await db.select().from(appReview).orderBy(desc(appReview.createdAt));
  }
}
