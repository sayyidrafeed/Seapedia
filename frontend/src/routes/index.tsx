import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listReviews, submitReview } from '@/lib/api/generated/sdk.gen';
import { useState } from 'react';
import { useAuth } from '@/lib/auth/context';

export const Route = createFileRoute('/')({
  component: HomePage,
});

function HomePage() {
  const auth = useAuth();
  const queryClient = useQueryClient();
  const [reviewerName, setReviewerName] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const { data: reviews, isLoading: loadingReviews } = useQuery({
    queryKey: ['reviews'],
    queryFn: async () => {
      const res = await listReviews({ throwOnError: true });
      return res.data;
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (body: { reviewerName: string; rating: number; comment: string }) => {
      const res = await submitReview({ body, throwOnError: true });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      setReviewerName('');
      setComment('');
      setRating(5);
      setSuccessMsg('Thank you! Your review was submitted successfully.');
      setTimeout(() => setSuccessMsg(null), 5000);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitMutation.mutate({
      reviewerName: reviewerName || auth.user?.username || 'Guest',
      rating,
      comment,
    });
  };

  return (
    <div className="space-y-16 py-12">
      <section className="container mx-auto px-6 text-center max-w-3xl space-y-6">
        <h1 className="text-5xl font-extrabold tracking-tight text-foreground sm:text-6xl">
          Welcome to <span className="text-primary">Seapedia</span>
        </h1>
        <p className="text-xl text-muted-foreground leading-relaxed">
          The all-in-one marketplace connecting buyers, sellers, and drivers in a unified trading
          ecosystem.
        </p>
        <div className="flex justify-center gap-4 pt-4">
          <Link
            to="/products"
            className="rounded-md bg-primary text-primary-foreground hover:bg-primary/90 px-5 py-3 text-sm font-semibold shadow-sm transition-all"
          >
            Explore Catalog
          </Link>
          {!auth.user && (
            <Link
              to="/register"
              className="rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/90 px-5 py-3 text-sm font-semibold border border-border shadow-sm transition-all"
            >
              Get Started
            </Link>
          )}
        </div>
      </section>

      <section className="bg-card border-t border-b border-border py-16">
        <div className="container mx-auto px-6 max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-foreground">Leave a Review</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Tell us about your experience using the Seapedia application.
              </p>
            </div>

            {successMsg && (
              <div className="rounded-md bg-green-500/15 p-4 text-sm text-green-600 border border-green-500/20">
                {successMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  className="text-xs font-semibold text-muted-foreground uppercase"
                  htmlFor="reviewer-name"
                >
                  Reviewer Name
                </label>
                <input
                  id="reviewer-name"
                  type="text"
                  value={reviewerName}
                  onChange={(e) => setReviewerName(e.target.value)}
                  placeholder={auth.user?.username || 'Guest / Your name'}
                  className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase">
                  Rating
                </label>
                <div className="flex gap-2 mt-1">
                  {[1, 2, 3, 4, 5].map((stars) => (
                    <button
                      key={stars}
                      type="button"
                      onClick={() => setRating(stars)}
                      className={`text-2xl cursor-pointer transition-colors ${
                        stars <= rating ? 'text-yellow-400' : 'text-muted-foreground/30'
                      }`}
                    >
                      &#9733;
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label
                  className="text-xs font-semibold text-muted-foreground uppercase"
                  htmlFor="comment"
                >
                  Comment
                </label>
                <textarea
                  id="comment"
                  required
                  rows={4}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your experience..."
                  className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={submitMutation.isPending}
                className="rounded-md bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2.5 text-xs font-semibold disabled:opacity-50 cursor-pointer"
              >
                {submitMutation.isPending ? 'Submitting...' : 'Submit Review'}
              </button>
            </form>
          </div>

          <div className="space-y-6">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">User Reviews</h2>

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
                    <div className="flex text-yellow-400 text-sm">
                      {Array.from({ length: review.rating }).map((_, i) => (
                        <span key={i}>&#9733;</span>
                      ))}
                      {Array.from({ length: 5 - review.rating }).map((_, i) => (
                        <span key={i} className="text-muted-foreground/30">
                          &#9733;
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {review.comment}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
