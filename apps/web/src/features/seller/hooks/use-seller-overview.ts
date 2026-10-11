import { useQuery } from '@tanstack/react-query';
import {
  getCurrentSellerStoreOptions,
  listSellerProductsOptions,
  listSellerOrdersOptions,
} from '@/lib/api/generated/@tanstack/react-query.gen';

export function useSellerOverview() {
  const storeQuery = useQuery({
    ...getCurrentSellerStoreOptions(),
    retry: false,
  });

  const productsQuery = useQuery({
    ...listSellerProductsOptions(),
    retry: false,
  });

  const ordersQuery = useQuery({
    ...listSellerOrdersOptions(),
    retry: false,
  });

  const totalProducts = productsQuery.data?.total ?? 0;
  const pendingOrders = ordersQuery.data?.filter((o) => o.status === 'sedang_dikemas').length ?? 0;

  return {
    store: storeQuery.data,
    totalProducts,
    pendingOrders,
    isLoading: storeQuery.isLoading || productsQuery.isLoading || ordersQuery.isLoading,
  };
}
