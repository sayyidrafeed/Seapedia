import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { listProducts } from '@/lib/api/generated/sdk.gen';
import { useState } from 'react';

export const Route = createFileRoute('/products/')({
  component: ProductsPage,
});

function ProductsPage() {
  const [search, setSearch] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['products', search],
    queryFn: async () => {
      const res = await listProducts({
        query: { search: search || undefined },
        throwOnError: true,
      });
      return res.data;
    },
  });

  return (
    <div className="container mx-auto px-6 py-12 max-w-5xl space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            Marketplace Catalog
          </h1>
          <p className="text-muted-foreground mt-1">
            Browse all available products from our verified stores.
          </p>
        </div>

        <div className="w-full sm:max-w-xs">
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {isLoading ? (
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
      ) : error ? (
        <div className="text-center py-12 text-sm text-destructive">
          Error loading products. Make sure the backend is running.
        </div>
      ) : data?.products.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">
          No products found matching your search.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {data?.products.map((product) => (
            <div
              key={product.id}
              className="group bg-card border border-border p-5 rounded-lg shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="space-y-2">
                <span className="text-xs text-primary font-semibold uppercase tracking-wider">
                  Store: {product.storeName}
                </span>
                <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                  {product.name}
                </h3>
                <p className="text-xs text-muted-foreground line-clamp-2">{product.description}</p>
              </div>

              <div className="flex items-center justify-between pt-6 mt-4 border-t border-border/50">
                <span className="text-base font-extrabold text-foreground">
                  ${product.price.toFixed(2)}
                </span>
                <Link
                  to="/products/$productId"
                  params={{ productId: product.id }}
                  className="rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/90 px-3 py-1.5 text-xs font-semibold transition-colors"
                >
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
