import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { listProducts } from '@/lib/api/generated/sdk.gen';
import { useState, useEffect } from 'react';
import { formatCurrency } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ApplicationReviewForm } from '@/components/public/application-review-form';
import { ApplicationReviewList } from '@/components/public/application-review-list';

export const Route = createFileRoute('/')({
  component: HomePage,
});

function HomePage() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const limit = 12;

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => {
      clearTimeout(handler);
    };
  }, [search]);

  // Products query
  const {
    data: productsData,
    isLoading: loadingProducts,
    error: productsError,
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

  return (
    <div className="space-y-16 py-12 flex-1 flex flex-col justify-between">
      {/* Hero / Header Section */}
      <section className="container mx-auto px-6 max-w-5xl space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
              Welcome to <span className="text-primary">Seapedia</span>
            </h1>
            <p className="text-muted-foreground mt-1">
              Browse all available products from our verified stores.
            </p>
          </div>

          <div className="w-full sm:max-w-xs">
            <Input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Product Catalog Grid */}
        {loadingProducts ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
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
            Error loading products. Make sure the backend is running.
          </div>
        ) : productsData?.products.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">
            No products found matching your search.
          </div>
        ) : (
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {productsData?.products.map((product) => (
                <div
                  key={product.id}
                  className="group bg-card border border-border p-5 rounded-lg shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <Link
                      to="/$storeSlug"
                      params={{ storeSlug: product.storeSlug }}
                      className="text-xs text-primary font-semibold uppercase tracking-wider hover:underline"
                    >
                      Store: {product.storeName}
                    </Link>
                    <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                      {product.name}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {(product.description as string) || ''}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-6 mt-4 border-t border-border/50">
                    <span className="text-base font-extrabold text-foreground">
                      {formatCurrency(product.price)}
                    </span>
                    <Link
                      to="/$storeSlug/$productSlug"
                      params={{
                        storeSlug: product.storeSlug,
                        productSlug: product.slug,
                      }}
                    >
                      <Button variant="secondary" size="sm" className="text-xs cursor-pointer">
                        View Details
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 pt-4">
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
      </section>

      {/* Reviews Section */}
      <section className="bg-card border-t border-b border-border py-16 mt-auto">
        <div className="container mx-auto px-6 max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-12">
          <ApplicationReviewForm />
          <ApplicationReviewList />
        </div>
      </section>
    </div>
  );
}
