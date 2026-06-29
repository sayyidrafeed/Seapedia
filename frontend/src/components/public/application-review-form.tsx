import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { submitReview } from '@/lib/api/generated/sdk.gen';
import { useAuth } from '@/lib/auth/context';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Star } from 'lucide-react';

export function ApplicationReviewForm() {
  const auth = useAuth();
  const queryClient = useQueryClient();
  const [reviewerName, setReviewerName] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Success message auto-dismissal
  useEffect(() => {
    if (!successMsg) return;
    const timer = setTimeout(() => {
      setSuccessMsg(null);
    }, 5000);
    return () => clearTimeout(timer);
  }, [successMsg]);

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
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl font-bold">Leave a Review</CardTitle>
        <CardDescription>
          Tell us about your experience using the Seapedia application.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {successMsg && (
          <div className="mb-4 rounded-md bg-green-500/15 p-4 text-sm text-green-600 border border-green-500/20">
            {successMsg}
          </div>
        )}

        {submitMutation.error && (
          <div className="mb-4 rounded-md bg-destructive/15 p-4 text-sm text-destructive border border-destructive/20">
            {submitMutation.error instanceof Error
              ? submitMutation.error.message
              : 'Failed to submit review. Please try again.'}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label
              className="text-xs font-semibold text-muted-foreground uppercase"
              htmlFor="reviewer-name"
            >
              Reviewer Name
            </label>
            <Input
              id="reviewer-name"
              type="text"
              value={reviewerName}
              onChange={(e) => setReviewerName(e.target.value)}
              placeholder={auth.user?.username || 'Guest / Your name'}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase">Rating</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((stars) => (
                <button
                  key={stars}
                  type="button"
                  onClick={() => setRating(stars)}
                  className="cursor-pointer transition-colors focus:outline-none"
                >
                  <Star
                    className={`h-6 w-6 ${
                      stars <= rating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-muted-foreground/30'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
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

          <Button
            type="submit"
            disabled={submitMutation.isPending}
            className="w-full text-xs font-semibold cursor-pointer"
          >
            {submitMutation.isPending ? 'Submitting...' : 'Submit Review'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
