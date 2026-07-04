import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { listProducts } from '@/lib/api/generated/sdk.gen';

export function useStoreCatalog(storeSlug: string, enabled: boolean) {
  const [page, setPage] = useState(1);
  const limit = 20;

  const {
    data: productsData,
    isLoading: isProductsLoading,
    error: productsError,
  } = useQuery({
    queryKey: ['store-products', storeSlug, page],
    queryFn: async () => {
      const res = await listProducts({
        query: { storeSlug, page, limit },
        throwOnError: true,
      });
      return res.data;
    },
    enabled,
  });

  const total = productsData?.total ?? 0;
  const totalPages = Math.ceil(total / limit) || 1;

  return {
    page,
    setPage,
    productsData,
    isProductsLoading,
    productsError,
    totalPages,
  };
}
