import { useQuery } from '@tanstack/react-query';
import { getBuyerExpenseReportOptions } from '@/lib/api/generated/@tanstack/react-query.gen';

export function useBuyerReport() {
  const {
    data: report,
    isLoading,
    error,
  } = useQuery({
    ...getBuyerExpenseReportOptions(),
    retry: false,
  });

  return {
    report,
    isLoading,
    error,
  };
}
