import { collections } from '@/db';

const toAppReview = ({
  _id,
  ...rest
}: {
  _id: string;
  reviewerName: string;
  rating: number;
  comment: string;
  createdAt: Date;
}) => ({
  id: _id,
  ...rest,
});

export class ReviewsService {
  static async createReview(input: { reviewerName: string; rating: number; comment: string }) {
    const review = { _id: crypto.randomUUID(), ...input, createdAt: new Date() };
    await collections.appReviews.insertOne(review);
    return toAppReview(review);
  }

  static async listReviews(pagination?: { limit: number; offset: number }) {
    let cursor = collections.appReviews.find().sort({ createdAt: -1 });
    if (pagination) cursor = cursor.skip(pagination.offset).limit(pagination.limit);
    return (await cursor.toArray()).map(toAppReview);
  }

  static async getReviewsStats() {
    const [stats] = await collections.appReviews
      .aggregate<{ totalReviews: number; averageRating: number }>([
        { $group: { _id: null, totalReviews: { $sum: 1 }, averageRating: { $avg: '$rating' } } },
        { $project: { _id: 0, totalReviews: 1, averageRating: 1 } },
      ])
      .toArray();
    return stats ?? { totalReviews: 0, averageRating: 0.0 };
  }
}
