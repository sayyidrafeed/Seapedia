import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { getCurrentSellerStoreOptions } from '@/lib/api/generated/@tanstack/react-query.gen';

export const Route = createFileRoute('/dashboard/seller/')({
  component: SellerDashboardIndex,
});

function SellerDashboardIndex() {
  const { data: store } = useQuery({
    ...getCurrentSellerStoreOptions(),
    retry: false,
  });

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border p-6 rounded-lg shadow-sm">
        <h2 className="text-lg font-bold text-foreground mb-4">Welcome back, {store?.name}!</h2>
        <p className="text-sm text-muted-foreground">
          This is your central hub for managing your products and incoming orders. (Product
          management and order processing will be added soon).
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card border border-border p-6 rounded-lg shadow-sm">
          <h3 className="font-semibold text-muted-foreground mb-2">Total Products</h3>
          <p className="text-3xl font-extrabold">0</p>
        </div>
        <div className="bg-card border border-border p-6 rounded-lg shadow-sm">
          <h3 className="font-semibold text-muted-foreground mb-2">Pending Orders</h3>
          <p className="text-3xl font-extrabold">0</p>
        </div>
        <div className="bg-card border border-border p-6 rounded-lg shadow-sm">
          <h3 className="font-semibold text-muted-foreground mb-2">Total Income</h3>
          <p className="text-3xl font-extrabold">Rp 0</p>
        </div>
      </div>
    </div>
  );
}
