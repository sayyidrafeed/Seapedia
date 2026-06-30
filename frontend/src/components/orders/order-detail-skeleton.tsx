export function OrderDetailSkeleton() {
  return (
    <div className="container mx-auto px-6 py-8 max-w-5xl animate-pulse space-y-6">
      <div className="h-6 bg-muted rounded w-1/6" />
      <div className="h-10 bg-muted rounded w-1/3" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="h-40 bg-muted rounded-xl" />
          <div className="h-60 bg-muted rounded-xl" />
        </div>
        <div className="h-80 bg-muted rounded-xl" />
      </div>
    </div>
  );
}
