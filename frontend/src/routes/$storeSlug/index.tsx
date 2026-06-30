import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { getPublicStoreInfoOptions } from '@/lib/api/generated/@tanstack/react-query.gen';
import { listProducts } from '@/lib/api/generated/sdk.gen';
import { useState } from 'react';
import { StoreHeader } from '@/features/marketplace/components/store-header';
import { MarketplaceProductCard } from '@/features/marketplace/components/marketplace-product-card';
import { PaginationControls } from '@/components/shared/pagination-controls';

export const Route = createFileRoute('/$storeSlug/')({
  component: PublicStorePage,
});

function PublicStorePage() {
  const { storeSlug } = Route.useParams();
  const [page, setPage] = useState(1);
  const limit = 20;

  const {
    data: store,
    isLoading: isStoreLoading,
    error: storeError,
  } = useQuery({
    ...getPublicStoreInfoOptions({
      path: {
        slugOrId: storeSlug,
      },
    }),
  });

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
    enabled: !!store,
  });

  if (isStoreLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <span className="animate-pulse text-muted-foreground text-sm font-medium">
          Loading store information...
        </span>
      </div>
    );
  }

  if (storeError || !store) {
    return (
      <div className="container mx-auto px-6 py-12 text-center">
        <h1 className="text-3xl font-bold mb-4">Store Not Found</h1>
        <p className="text-muted-foreground">The store you are looking for does not exist.</p>
      </div>
    );
  }

  const total = productsData?.total ?? 0;
  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="container mx-auto px-6 py-12 space-y-8">
      {/* Store Header */}
      <StoreHeader store={store} />

      {/* Store Products */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight">Products</h2>
        {isProductsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="border border-border p-5 rounded-lg space-y-3 animate-pulse bg-card"
              >
                <div className="h-4 bg-muted rounded w-2/3" />
                <div className="h-3 bg-muted rounded w-1/2" />
                <div className="h-6 bg-muted rounded w-1/3 pt-3" />
              </div>
            ))}
          </div>
        ) : productsError ? (
          <div className="text-center py-12 text-sm text-destructive">
            Error loading products for this store.
          </div>
        ) : productsData?.products.length === 0 ? (
          <div className="bg-muted/30 border border-border p-12 rounded-xl text-center">
            <p className="text-muted-foreground text-sm">No products listed by this store yet.</p>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {productsData?.products.map((product) => (
                <MarketplaceProductCard key={product.id} product={product} showStoreName={false} />
              ))}
            </div>

            {/* Pagination Controls */}
            <PaginationControls page={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        )}
      </div>
    </div>
  );
}
