import { useSearch, useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { listProducts } from '@/lib/api/generated/sdk.gen';

export function useStoreCatalog(storeSlug: string, enabled: boolean) {
  const search = useSearch({ from: '/$storeSlug/' });
  const page = search.page ?? 1;
  const navigate = useNavigate({ from: '/$storeSlug/' });
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

  const setPage = (newPage: number) => {
    navigate({
      search: (prev) => ({ ...prev, page: newPage }),
    });
  };

  return {
    page,
    setPage,
    productsData,
    isProductsLoading,
    productsError,
    totalPages,
  };
}
