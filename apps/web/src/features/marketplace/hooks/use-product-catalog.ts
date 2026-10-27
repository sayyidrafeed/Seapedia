import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDebounce } from 'use-debounce';
import { listProducts } from '@/lib/api/generated/sdk.gen';

export function useProductCatalog() {
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebounce(search, 300);
  const [page, setPage] = useState(1);
  const limit = 12;

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const {
    data: productsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['products', debouncedSearch, page],
    queryFn: async () => {
      const res = await listProducts({
        query: { search: debouncedSearch || undefined, page, limit },
        throwOnError: true,
      });
      return res.data;
    },
  });

  const total = productsData?.total ?? 0;
  const totalPages = Math.ceil(total / limit) || 1;

  return {
    search,
    page,
    limit,
    productsData,
    isLoading,
    error,
    totalPages,
    setSearch,
    setPage,
  };
}
