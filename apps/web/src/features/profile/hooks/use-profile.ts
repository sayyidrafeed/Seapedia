import { useQuery } from '@tanstack/react-query';
import { getCurrentUserFinancialSummaryOptions } from '@/lib/api/generated/@tanstack/react-query.gen';

export function useProfile(isUserLoaded: boolean) {
  const { data: financialSummary, isLoading } = useQuery({
    ...getCurrentUserFinancialSummaryOptions(),
    enabled: isUserLoaded,
  });

  return {
    financialSummary,
    isLoading,
  };
}
