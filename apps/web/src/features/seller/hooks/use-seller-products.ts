import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listSellerProductsOptions,
  listSellerProductsQueryKey,
} from '@/lib/api/generated/@tanstack/react-query.gen';
import { deleteSellerProduct } from '@/lib/api/generated';
import { toast } from 'sonner';

export function useSellerProducts() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data, isLoading } = useQuery({
    ...listSellerProductsOptions({ query: { page, limit } }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await deleteSellerProduct({
        path: { id },
      });
      if (error) {
        throw new Error((error as { error?: string }).error || 'Failed to delete product');
      }
    },
    onSuccess: () => {
      toast.success('Product deleted successfully');
      queryClient.invalidateQueries({ queryKey: listSellerProductsQueryKey() });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      deleteMutation.mutate(id);
    }
  };

  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / limit) || 1;

  return {
    products: data?.products ?? [],
    total,
    totalPages,
    page,
    isLoading,
    isDeleting: deleteMutation.isPending,
    setPage,
    deleteProduct: handleDelete,
  };
}
