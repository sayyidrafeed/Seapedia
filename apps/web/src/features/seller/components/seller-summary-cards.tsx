import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

interface SellerSummaryCardsProps {
  totalProducts: number;
  pendingOrders: number;
}

export function SellerSummaryCards({ totalProducts, pendingOrders }: SellerSummaryCardsProps) {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Link to="/dashboard/seller/products" className="block hover:opacity-90 transition-opacity">
        <div className="bg-card border border-border p-6 rounded-lg shadow-sm">
          <h3 className="font-semibold text-muted-foreground mb-2">
            {t('seller.summary.totalProducts')}
          </h3>
          <p className="text-3xl font-extrabold">{totalProducts}</p>
        </div>
      </Link>
      <Link to="/dashboard/seller/orders" className="block hover:opacity-90 transition-opacity">
        <div className="bg-card border border-border p-6 rounded-lg shadow-sm">
          <h3 className="font-semibold text-muted-foreground mb-2">
            {t('seller.summary.pendingOrders')}
          </h3>
          <p className="text-3xl font-extrabold">{pendingOrders}</p>
        </div>
      </Link>
      <div className="bg-card border border-border p-6 rounded-lg shadow-sm">
        <h3 className="font-semibold text-muted-foreground mb-2">
          {t('seller.summary.totalIncome')}
        </h3>
        <p className="text-3xl font-extrabold">Rp 0</p>
      </div>
    </div>
  );
}
