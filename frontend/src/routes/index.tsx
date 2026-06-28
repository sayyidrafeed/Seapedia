import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listReviews, submitReview, listProducts } from '@/lib/api/generated/sdk.gen';
import { useState } from 'react';
import { useAuth } from '@/lib/auth/context';
import { formatCurrency } from '@/lib/utils';

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
  const [search, setSearch] = useState('');

  // Products query
  const {
    data: productsData,
    isLoading: loadingProducts,
    error: productsError,
  } = useQuery({
    queryKey: ['products', search],
    queryFn: async () => {
      const res = await listProducts({
        query: { search: search || undefined },
        throwOnError: true,
      });
      return res.data;
    },
  });

  // Reviews query
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
      {/* Hero / Header Section */}
      <section className="container mx-auto px-6 max-w-5xl space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
              Welcome to <span className="text-primary">Seapedia</span>
            </h1>
            <p className="text-muted-foreground mt-1">
              Browse all available products from our verified stores.
            </p>
          </div>

          <div className="w-full sm:max-w-xs">
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        {/* Product Catalog Grid */}
        {loadingProducts ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="border border-border p-5 rounded-lg space-y-3 animate-pulse bg-card"
              >
                <div className="h-4 bg-muted rounded w-2/3" />
                <div className="h-3 bg-muted rounded w-1/2" />
                <div className="h-6 bg-muted rounded w-1/3 pt-3" />
              </div>
            ))}
          </div>
        ) : productsError ? (
          <div className="text-center py-12 text-sm text-destructive">
            Error loading products. Make sure the backend is running.
          </div>
        ) : productsData?.products.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">
            No products found matching your search.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {productsData?.products.map((product) => (
              <div
                key={product.id}
                className="group bg-card border border-border p-5 rounded-lg shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <span className="text-xs text-primary font-semibold uppercase tracking-wider">
                    Store: {product.storeName}
                  </span>
                  <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                    {product.name}
                  </h3>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {product.description}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-6 mt-4 border-t border-border/50">
                  <span className="text-base font-extrabold text-foreground">
                    {formatCurrency(product.price)}
                  </span>
                  <Link
                    to="/$storeSlug/$productSlug"
                    params={{
                      storeSlug: product.storeSlug,
                      productSlug: product.slug,
                    }}
                    className="rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/90 px-3 py-1.5 text-xs font-semibold transition-colors"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Reviews Section */}
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
