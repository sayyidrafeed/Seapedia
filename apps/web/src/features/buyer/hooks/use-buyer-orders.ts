import { useQuery } from '@tanstack/react-query';
import { listBuyerOrdersOptions } from '@/lib/api/generated/@tanstack/react-query.gen';

export function useBuyerOrders() {
  const {
    data: orders,
    isLoading,
    error,
  } = useQuery({
    ...listBuyerOrdersOptions(),
    retry: false,
  });

  return {
    orders,
    isLoading,
    error,
  };
}
