import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { getPublicStoreInfoOptions } from '@/lib/api/generated/@tanstack/react-query.gen';

export const Route = createFileRoute('/$storeSlug/')({
  component: PublicStorePage,
});

function PublicStorePage() {
  const { storeSlug } = Route.useParams();

  const {
    data: store,
    isLoading,
    error,
  } = useQuery({
    ...getPublicStoreInfoOptions({
      path: {
        slugOrId: storeSlug,
      },
    }),
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <span className="animate-pulse text-muted-foreground text-sm font-medium">
          Loading store information...
        </span>
      </div>
    );
  }

  if (error || !store) {
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

      {/* Products Placeholder */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight">Products</h2>
        <div className="bg-muted/50 border border-border border-dashed p-12 rounded-xl text-center">
          <p className="text-muted-foreground">
            Products for this store will be listed here (Level 2).
          </p>
        </div>
      </div>
    </div>
  );
}
