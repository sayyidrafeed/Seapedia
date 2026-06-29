import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { getPublicStoreInfoOptions } from '@/lib/api/generated/@tanstack/react-query.gen';
import { listProducts } from '@/lib/api/generated/sdk.gen';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export const Route = createFileRoute('/$storeSlug/')({
  component: PublicStorePage,
});

function PublicStorePage() {
  const { storeSlug } = Route.useParams();

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
    queryKey: ['store-products', storeSlug],
    queryFn: async () => {
      const res = await listProducts({
        query: { storeSlug },
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

  return (
    <div className="container mx-auto px-6 py-12 space-y-8">
      {/* Store Header */}
      <div className="bg-card border border-border p-8 rounded-xl shadow-sm text-center md:text-left md:flex items-center gap-6">
        <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto md:mx-0 text-3xl font-bold text-primary">
          {store.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">{store.name}</h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            {(store.description as string) || 'Welcome to our store on Seapedia!'}
          </p>
          <div className="mt-4 text-sm text-muted-foreground">
            Joined on {new Date(store.createdAt).toLocaleDateString()}
          </div>
        </div>
      </div>

      {/* Store Products */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight">Products</h2>
        {isProductsLoading ? (
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
            Error loading products for this store.
          </div>
        ) : productsData?.products.length === 0 ? (
          <div className="bg-muted/30 border border-border p-12 rounded-xl text-center">
            <p className="text-muted-foreground text-sm">No products listed by this store yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {productsData?.products.map((product) => (
              <div
                key={product.id}
                className="group bg-card border border-border p-5 rounded-lg shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="space-y-2">
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
        )}
      </div>
    </div>
  );
}
