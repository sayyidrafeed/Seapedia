import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getDriverJobDetailOptions,
  takeDeliveryJobMutation,
  getDriverStatsQueryKey,
  listAvailableJobsQueryKey,
  getDriverJobDetailQueryKey,
} from '@/lib/api/generated/@tanstack/react-query.gen';
import { formatCurrency } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import type { TakeDeliveryJobError } from '@/lib/api/generated';
import {
  PickupCard,
  DropoffCard,
  PackageContentsCard,
  OrderSummaryCard,
} from '@/features/driver/components/job-cards';

export const Route = createFileRoute('/dashboard/driver/jobs/$jobId')({
  component: JobDetail,
});

function JobDetail() {
  const { jobId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    data: job,
    isLoading,
    error,
  } = useQuery(getDriverJobDetailOptions({ path: { id: jobId } }));

  const takeJob = useMutation({
    ...takeDeliveryJobMutation(),
    onSuccess: (data) => {
      toast.success(data.message || 'Job claimed successfully!');
      queryClient.invalidateQueries({ queryKey: getDriverStatsQueryKey() });
      queryClient.invalidateQueries({ queryKey: listAvailableJobsQueryKey() });
      navigate({ to: '/dashboard/driver' });
    },
    onError: (err: TakeDeliveryJobError) => {
      const apiErr = err as { body?: { error?: string }; status?: number };
      toast.error(apiErr.body?.error || 'Failed to claim delivery job');
      // Refresh queries on error (especially for 409 conflicts) to ensure UI is up-to-date
      queryClient.invalidateQueries({ queryKey: getDriverStatsQueryKey() });
      queryClient.invalidateQueries({ queryKey: listAvailableJobsQueryKey() });
      queryClient.invalidateQueries({
        queryKey: getDriverJobDetailQueryKey({ path: { id: jobId } }),
      });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-6 w-24 bg-muted animate-pulse rounded" />
        <div className="h-48 bg-muted animate-pulse rounded-lg" />
        <div className="h-48 bg-muted animate-pulse rounded-lg" />
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="space-y-4">
        <Link
          to="/dashboard/driver/jobs"
          className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground gap-1"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Jobs
        </Link>
        <Card className="p-6 text-center text-red-500">
          Error loading job details: {error instanceof Error ? error.message : 'Job not found'}
        </Card>
      </div>
    );
  }

  const isJobClaimedOrDone = job.status !== 'pending';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          to="/dashboard/driver/jobs"
          className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground gap-1"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Jobs
        </Link>
        <Badge className="px-3 py-1 font-semibold uppercase">{job.status}</Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Job details */}
        <div className="md:col-span-2 space-y-6">
          <PickupCard storeName={job.storeName} />
          <DropoffCard address={job.addressSnapshot} />
          <PackageContentsCard items={job.items} />
        </div>

        {/* Earning / Summary Card */}
        <div className="space-y-6">
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                Job Earnings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <div className="text-3xl font-extrabold text-primary">
                  {formatCurrency(job.deliveryFee)}
                </div>
                <p className="text-xs text-muted-foreground">
                  You will earn 100% of the delivery fee upon successful delivery
                </p>
              </div>

              <Button
                className="w-full cursor-pointer mt-2"
                size="lg"
                disabled={isJobClaimedOrDone || takeJob.isPending}
                onClick={() => takeJob.mutate({ path: { id: job.id } })}
              >
                {takeJob.isPending
                  ? 'Taking job...'
                  : isJobClaimedOrDone
                    ? `Job already ${job.status}`
                    : 'Take Delivery Job'}
              </Button>
            </CardContent>
          </Card>

          <OrderSummaryCard
            orderId={job.orderId}
            deliveryMethod={job.deliveryMethod}
            totalAmount={job.totalAmount}
            createdAt={job.createdAt}
          />
        </div>
      </div>
    </div>
  );
}
