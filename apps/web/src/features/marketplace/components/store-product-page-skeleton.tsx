export function StoreProductPageSkeleton() {
  return (
    <div className="container mx-auto px-6 py-12 max-w-5xl animate-pulse space-y-6">
      <div className="h-8 bg-muted rounded w-1/3" />
      <div className="h-4 bg-muted rounded w-1/4" />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 h-80 bg-muted rounded-xl" />
        <div className="lg:col-span-5 h-80 bg-muted rounded-xl" />
        <div className="lg:col-span-3 h-80 bg-muted rounded-xl" />
      </div>
    </div>
  );
}
