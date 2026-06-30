import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getDashboardStatsOptions } from '@/lib/api/generated/@tanstack/react-query.gen';
import { processOverdueOrders, simulateTime } from '@/lib/api/generated';
import { toast } from 'sonner';

export function useAdminDashboard(isAdminActive: boolean) {
  const queryClient = useQueryClient();

  const {
    data: stats,
    isLoading,
    error,
  } = useQuery({
    ...getDashboardStatsOptions(),
    enabled: isAdminActive,
    refetchInterval: 30000,
  });

  const simulateMutation = useMutation({
    mutationFn: async (hours: number) => {
      const { data, error } = await simulateTime({
        body: { hoursToAdvance: hours },
      });
      if (error) throw new Error(error.error || 'Failed to simulate time');
      return data;
    },
    onSuccess: (data) => {
      toast.success(
        data.newOffsetHours === 0
          ? 'System time offset has been reset!'
          : `Simulated time forward by ${data.newOffsetHours} hours!`,
      );
      queryClient.invalidateQueries({ queryKey: getDashboardStatsOptions().queryKey });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const processOverdueMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await processOverdueOrders();
      if (error) throw new Error(error.error || 'Failed to process overdue orders');
      return data;
    },
    onSuccess: (data) => {
      if (data.processedCount > 0) {
        toast.success(`Successfully processed ${data.processedCount} overdue orders!`);
      } else {
        toast.info('No overdue orders found to process.');
      }
      queryClient.invalidateQueries({ queryKey: getDashboardStatsOptions().queryKey });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  return {
    stats,
    isLoading,
    error,
    isSimulating: simulateMutation.isPending,
    isProcessingOverdue: processOverdueMutation.isPending,
    simulateTime: (hours: number) => simulateMutation.mutate(hours),
    processOverdueOrders: () => processOverdueMutation.mutate(),
  };
}
