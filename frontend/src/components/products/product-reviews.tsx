import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Star, MessageSquare, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

import { useAuth } from '@/lib/auth/context';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { submitProductReview } from '@/lib/api/generated/sdk.gen';
import { getProductReviewsOptions } from '@/lib/api/generated/@tanstack/react-query.gen';

interface ProductReviewsProps {
  productId: string;
}

export function ProductReviews({ productId }: ProductReviewsProps) {
  const { t, i18n } = useTranslation();
  const auth = useAuth();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  // Reset page when product ID changes
  useEffect(() => {
    setPage(1);
  }, [productId]);

  // Fetch reviews
  const { data, isLoading } = useQuery({
    ...getProductReviewsOptions({
      path: { id: productId },
      query: { page, limit: 5 },
    }),
  });

  // Submit review mutation
  const submitReview = useMutation({
    mutationFn: async (vars: {
      path: { id: string };
      body: { rating: number; comment: string };
    }) => {
      const res = await submitProductReview({
        path: vars.path,
        body: vars.body,
        throwOnError: true,
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success(t('reviews.success', 'Ulasan berhasil dikirim!'));
      setComment('');
      setRating(5);
      // Invalidate both reviews list and product details queries to refresh ratings & counts
      queryClient.invalidateQueries({ queryKey: ['getProductReviews'] });
      queryClient.invalidateQueries({ queryKey: ['product'] });
    },
    onError: (error: unknown) => {
      const err = error as { body?: { error?: string }; message?: string };
      const msg =
        err?.body?.error || err?.message || t('reviews.error', 'Gagal mengirimkan ulasan');
      toast.error(msg);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      toast.error(t('reviews.commentRequired', 'Komentar tidak boleh kosong'));
      return;
    }
    submitReview.mutate({
      path: { id: productId },
      body: { rating, comment },
    });
  };

  const reviews = data?.reviews || [];
  const total = data?.total || 0;
  const isBuyer = auth.user && auth.activeRole === 'buyer';

  return (
    <div className="space-y-8 border-t border-border/50 pt-8 mt-12">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          {t('reviews.title', 'Ulasan Produk')} ({total})
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Side: Reviews List */}
        <div className="md:col-span-2 space-y-4">
          {isLoading ? (
            <div className="space-y-4 animate-pulse">
              {[1, 2].map((i) => (
                <div key={i} className="h-28 bg-muted rounded-lg" />
              ))}
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-border rounded-lg bg-card text-muted-foreground">
              <p className="text-sm">{t('reviews.empty', 'Belum ada ulasan untuk produk ini.')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <Card key={review.id} className="border-border/50 shadow-sm">
                  <CardContent className="p-4 sm:p-6 space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-foreground">
                            {review.reviewerName}
                          </span>
                          <Badge
                            variant="secondary"
                            className="bg-primary/10 text-primary text-[10px] py-0 px-2 font-medium flex items-center gap-0.5"
                          >
                            <CheckCircle className="h-3 w-3" />
                            {t('reviews.verifiedPurchase', 'Pembelian Terverifikasi')}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {new Date(review.createdAt).toLocaleDateString(i18n.language, {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {review.comment}
                    </p>
                  </CardContent>
                </Card>
              ))}

              {/* Pagination */}
              {total > 5 && (
                <div className="flex justify-between items-center pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    &larr; {t('reviews.prev', 'Prev')}
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    {t('reviews.pageOf', 'Page {{page}} of {{totalPages}}', {
                      page,
                      totalPages: Math.ceil(total / 5),
                    })}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page * 5 >= total}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    {t('reviews.next', 'Next')} &rarr;
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Side: Form (Only for logged in buyers) */}
        <div className="space-y-6">
          {isBuyer ? (
            <Card className="border-primary/20 shadow-md relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-[3px] bg-primary" />
              <CardContent className="p-6 space-y-4">
                <h3 className="font-bold text-lg text-foreground">
                  {t('reviews.writeTitle', 'Tulis Ulasan')}
                </h3>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Star Rating Selector */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase">
                      {t('reviews.ratingLabel', 'Peringkat')}
                    </label>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => {
                        const starValue = i + 1;
                        return (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setRating(starValue)}
                            className="hover:scale-110 transition-transform duration-100"
                          >
                            <Star
                              className={`h-6 w-6 ${
                                starValue <= rating
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-muted-foreground/30'
                              }`}
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Comment Input */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase">
                      {t('reviews.commentLabel', 'Ulasan')}
                    </label>
                    <Textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder={t(
                        'reviews.placeholder',
                        'Bagikan pengalaman Anda menggunakan produk ini...',
                      )}
                      maxLength={1000}
                      className="min-h-[100px] text-sm resize-none"
                    />
                  </div>

                  {/* Warning Notice */}
                  <div className="rounded-md bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/30 p-3 flex gap-2.5">
                    <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-[11px] leading-relaxed text-amber-700 dark:text-amber-400">
                      {t(
                        'reviews.immutableWarning',
                        'Ulasan bersifat permanen dan tidak dapat diubah atau dihapus setelah dikirimkan.',
                      )}
                    </p>
                  </div>

                  <Button
                    type="submit"
                    className="w-full font-semibold"
                    disabled={submitReview.isPending}
                  >
                    {submitReview.isPending
                      ? t('reviews.submitting', 'Mengirim...')
                      : t('reviews.submitButton', 'Kirim Ulasan')}
                  </Button>
                </form>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-border bg-muted/30">
              <CardContent className="p-6 text-center space-y-2">
                <AlertCircle className="h-8 w-8 text-muted-foreground/60 mx-auto" />
                <h4 className="font-semibold text-sm text-foreground">
                  {t('reviews.notEligibleTitle', 'Ingin Memberikan Ulasan?')}
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed max-w-xs mx-auto">
                  {t(
                    'reviews.notEligibleDesc',
                    'Hanya pembeli terverifikasi yang telah menyelesaikan pembelian produk ini yang dapat memberikan ulasan.',
                  )}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
