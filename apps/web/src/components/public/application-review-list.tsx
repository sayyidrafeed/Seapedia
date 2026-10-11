import { useQuery } from '@tanstack/react-query';
import { listReviews } from '@/lib/api/generated/sdk.gen';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Star } from 'lucide-react';

export function ApplicationReviewList() {
  const {
    data: reviews,
    isLoading: loadingReviews,
    error: reviewsError,
  } = useQuery({
    queryKey: ['reviews'],
    queryFn: async () => {
      const res = await listReviews({ throwOnError: true });
      return res.data;
    },
  });

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl font-bold">User Reviews</CardTitle>
      </CardHeader>
      <CardContent>
        {loadingReviews ? (
          <div className="space-y-4">
            {[1, 2].map((n) => (
              <div
                key={n}
                className="border border-border p-4 rounded-lg bg-background animate-pulse space-y-2"
              >
                <div className="h-4 bg-muted rounded w-1/3" />
                <div className="h-3 bg-muted rounded w-full" />
              </div>
            ))}
          </div>
        ) : reviewsError ? (
          <p className="text-sm text-destructive text-center py-4 border border-destructive/20 rounded-md bg-destructive/5">
            Failed to load reviews. Please verify that the backend server is running.
          </p>
        ) : reviews?.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No reviews have been submitted yet. Be the first!
          </p>
        ) : (
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
            {reviews?.map((review) => (
              <div
                key={review.id}
                className="border border-border p-4 rounded-lg bg-background shadow-sm space-y-2"
              >
                <div className="flex items-center justify-between">
                  <strong className="text-sm font-semibold text-foreground">
                    {review.reviewerName}
                  </strong>
                  <span className="text-xs text-muted-foreground">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex text-yellow-400 text-sm gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < review.rating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-muted-foreground/30'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{review.comment}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
