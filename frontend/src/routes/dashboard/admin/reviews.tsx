import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { listReviewsOptions } from '@/lib/api/generated/@tanstack/react-query.gen';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Star, MessageSquare, Calendar, User, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const Route = createFileRoute('/dashboard/admin/reviews')({
  component: AdminReviewsPage,
});

function AdminReviewsPage() {
  const { t } = useTranslation();
  const { data: reviews, isLoading, error } = useQuery(listReviewsOptions());

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="text-muted-foreground text-sm font-medium">
          {t('admin.reviews.loading')}
        </span>
      </div>
    );
  }

  if (error || !reviews) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center space-y-4 text-center">
        <span className="text-destructive font-semibold">{t('admin.reviews.errorLoading')}</span>
        <p className="text-muted-foreground text-xs max-w-sm">
          {error instanceof Error ? error.message : ''}
        </p>
      </div>
    );
  }

  // Calculate frontend statistics
  const totalReviews = reviews.length;
  const averageRating =
    totalReviews > 0
      ? (reviews.reduce((acc, curr) => acc + curr.rating, 0) / totalReviews).toFixed(1)
      : '0.0';

  // Sort reviews newest first
  const sortedReviews = [...reviews].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          {t('admin.reviews.title')}
        </h1>
        <p className="text-muted-foreground text-sm">{t('admin.reviews.desc')}</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border border-border/80 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('admin.reviews.totalReviews')}
            </CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalReviews}</div>
          </CardContent>
        </Card>
        <Card className="border border-border/80 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('admin.reviews.averageRating')}
            </CardTitle>
            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-baseline gap-1">
              {averageRating}
              <span className="text-xs text-muted-foreground font-normal">/ 5.0</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reviews list */}
      <div className="space-y-4">
        {sortedReviews.length === 0 ? (
          <Card className="border border-border/80 shadow-sm p-8 text-center text-muted-foreground">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 text-muted-foreground/60" />
            <p className="text-sm font-medium">{t('admin.reviews.noReviews')}</p>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {sortedReviews.map((review) => (
              <Card
                key={review.id}
                className="border border-border/80 shadow-sm flex flex-col justify-between"
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <User className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm text-foreground line-clamp-1">
                          {review.reviewerName}
                        </h4>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                          <Calendar className="h-3 w-3" />
                          <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    {/* Stars */}
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-4 w-4 ${
                            review.rating >= star
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-muted-foreground/20'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-2 flex-grow">
                  <p className="text-muted-foreground text-sm whitespace-pre-wrap leading-relaxed">
                    {review.comment}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
