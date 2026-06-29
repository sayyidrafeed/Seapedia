import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listSellerProductsOptions,
  listSellerProductsQueryKey,
} from '@/lib/api/generated/@tanstack/react-query.gen';
import { deleteSellerProduct } from '@/lib/api/generated';
import { ProductList } from '@/components/products/product-list';
import type { ProductItem } from '@/components/products/product-list';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

import { useState } from 'react';

export const Route = createFileRoute('/dashboard/seller/products/')({
  component: SellerProductsPage,
});

function SellerProductsPage() {
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">Products Management</h2>
          <p className="text-sm text-muted-foreground">
            Manage the catalog of products for your store.
          </p>
        </div>
        <Link to="/dashboard/seller/products/create">
          <Button className="w-full sm:w-auto inline-flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Product
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <span className="animate-pulse text-muted-foreground text-sm font-medium">
            Loading products...
          </span>
        </div>
      ) : (
        <div className="space-y-4">
          <ProductList
            products={(data?.products as ProductItem[]) ?? []}
            onDelete={handleDelete}
            isDeleting={deleteMutation.isPending}
          />

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <span className="text-sm font-medium">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
