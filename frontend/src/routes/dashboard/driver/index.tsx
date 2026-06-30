import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import {
  getDriverStatsOptions,
  completeDeliveryJobMutation,
  getDriverStatsQueryKey,
  listAvailableJobsQueryKey,
  getDriverJobHistoryOptions,
  getDriverJobHistoryQueryKey,
} from '@/lib/api/generated/@tanstack/react-query.gen';
import { Card } from '@/components/ui/card';
import type { CompleteDeliveryJobError } from '@/lib/api/generated';
import { toast } from 'sonner';
import { SecurityTest } from './components/SecurityTest';
import { useState } from 'react';
import { StatsCards, ActiveDeliveriesCard } from './components/DashboardComponents';
import { HistoryCard } from './components/HistoryCard';

export const Route = createFileRoute('/dashboard/driver/')({
  component: DriverOverview,
});

function DriverOverview() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const limit = 5;

  const { data: stats, isLoading, error } = useQuery(getDriverStatsOptions());

  const { data: historyData, isLoading: isHistoryLoading } = useQuery({
    ...getDriverJobHistoryOptions({
      query: { page, limit },
    }),
    placeholderData: keepPreviousData,
  });

  const completeMutation = useMutation({
    ...completeDeliveryJobMutation(),
    onSuccess: (data) => {
      toast.success(data.message || 'Delivery completed successfully!');
      queryClient.invalidateQueries({ queryKey: getDriverStatsQueryKey() });
      queryClient.invalidateQueries({ queryKey: listAvailableJobsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getDriverJobHistoryQueryKey() });
    },
    onError: (err: CompleteDeliveryJobError) => {
      const apiErr = err as { body?: { error?: string } };
      toast.error(apiErr.body?.error || 'Failed to complete delivery');
    },
  });

  if (isLoading)
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-muted rounded-lg" />
          ))}
        </div>
        <div className="h-48 bg-muted rounded-lg" />
      </div>
    );
  if (error || !stats)
    return (
      <Card className="p-6 text-center text-red-500">
        Error: {error instanceof Error ? error.message : 'Failed to load'}
      </Card>
    );

  return (
    <div className="space-y-6">
      <StatsCards stats={stats} />

      <ActiveDeliveriesCard
        activeJobs={stats.activeJobs}
        isPending={completeMutation.isPending}
        onComplete={(jobId) => completeMutation.mutate({ path: { id: jobId } })}
      />

      <HistoryCard
        jobs={historyData?.jobs || []}
        total={historyData?.total || 0}
        page={page}
        limit={limit}
        isLoading={isHistoryLoading}
        onPrevPage={() => setPage((p) => Math.max(1, p - 1))}
        onNextPage={() =>
          setPage((p) => Math.max(1, Math.min(Math.ceil((historyData?.total || 0) / limit), p + 1)))
        }
      />

      <SecurityTest />
    </div>
  );
}
