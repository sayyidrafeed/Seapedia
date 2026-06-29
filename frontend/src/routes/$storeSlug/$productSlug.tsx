import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { getProductBySlug } from '@/lib/api/generated/sdk.gen';
import { formatCurrency } from '@/lib/utils';

export const Route = createFileRoute('/$storeSlug/$productSlug')({
  component: StoreProductPage,
});

function StoreProductPage() {
  const { storeSlug, productSlug } = Route.useParams();

  const {
    data: product,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['product', storeSlug, productSlug],
    queryFn: async () => {
      const res = await getProductBySlug({
        path: { storeSlug, productSlug },
        throwOnError: true,
      });
      return res.data;
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-6 py-12 max-w-3xl animate-pulse space-y-6">
        <div className="h-8 bg-muted rounded w-1/3" />
        <div className="h-4 bg-muted rounded w-1/4" />
        <div className="h-24 bg-muted rounded w-full" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container mx-auto px-6 py-12 text-center text-sm text-destructive">
        Error loading product details. Product may not exist.
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-12 max-w-3xl space-y-8">
      <Link
        to="/"
        className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
      >
        &larr; Back to Catalog
      </Link>

      <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden p-6 sm:p-8 space-y-6">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/$storeSlug"
              params={{ storeSlug: product.storeSlug }}
              className="rounded-full bg-primary/10 text-primary text-xs font-semibold px-2.5 py-0.5 capitalize hover:bg-primary/20"
            >
              Store: {product.storeName}
            </Link>
            <span className="text-xs text-muted-foreground">Stock: {product.stock} left</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">{product.name}</h1>
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed border-t border-b border-border/50 py-6">
          {(product.description as string) || ''}
        </p>

        {/* Store Information Card */}
        <div className="bg-muted/40 border border-border p-4 rounded-lg flex items-center justify-between gap-4">
          <div>
            <h4 className="text-sm font-bold text-foreground">Sells by {product.storeName}</h4>
            <p className="text-xs text-muted-foreground mt-1">
              Click to visit store page for more items.
            </p>
          </div>
          <Link
            to="/$storeSlug"
            params={{ storeSlug: product.storeSlug }}
            className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-semibold hover:bg-muted"
          >
            Visit Store
          </Link>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-2">
          <div>
            <span className="text-xs font-semibold text-muted-foreground uppercase">Price</span>
            <p className="text-3xl font-black text-foreground mt-1">
              {formatCurrency(product.price)}
            </p>
          </div>

          <div>
            <button className="w-full sm:w-auto rounded-md bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-3 text-sm font-semibold transition-colors disabled:opacity-50 cursor-not-allowed">
              Add to Cart (Level 3)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
