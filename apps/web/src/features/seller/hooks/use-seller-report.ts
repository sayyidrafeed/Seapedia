import { useQuery } from '@tanstack/react-query';
import { getSellerIncomeReportOptions } from '@/lib/api/generated/@tanstack/react-query.gen';

export function useSellerReport() {
  const {
    data: report,
    isLoading,
    error,
  } = useQuery({
    ...getSellerIncomeReportOptions(),
    retry: false,
  });

  return {
    report,
    isLoading,
    error,
  };
}
