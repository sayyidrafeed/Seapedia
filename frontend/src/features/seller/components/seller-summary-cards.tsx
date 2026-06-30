import { Link } from '@tanstack/react-router';

interface SellerSummaryCardsProps {
  totalProducts: number;
  pendingOrders: number;
}

export function SellerSummaryCards({ totalProducts, pendingOrders }: SellerSummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Link to="/dashboard/seller/products" className="block hover:opacity-90 transition-opacity">
        <div className="bg-card border border-border p-6 rounded-lg shadow-sm">
          <h3 className="font-semibold text-muted-foreground mb-2">Total Products</h3>
          <p className="text-3xl font-extrabold">{totalProducts}</p>
        </div>
      </Link>
      <Link to="/dashboard/seller/orders" className="block hover:opacity-90 transition-opacity">
        <div className="bg-card border border-border p-6 rounded-lg shadow-sm">
          <h3 className="font-semibold text-muted-foreground mb-2">Pending Orders</h3>
          <p className="text-3xl font-extrabold">{pendingOrders}</p>
        </div>
      </Link>
      <div className="bg-card border border-border p-6 rounded-lg shadow-sm">
        <h3 className="font-semibold text-muted-foreground mb-2">Total Income</h3>
        <p className="text-3xl font-extrabold">Rp 0</p>
      </div>
    </div>
  );
}
