import { createFileRoute } from '@tanstack/react-router';
import { useSellerOverview } from '@/features/seller/hooks/use-seller-overview';
import { SellerSummaryCards } from '@/features/seller/components/seller-summary-cards';
import { useTranslation } from 'react-i18next';

export const Route = createFileRoute('/dashboard/seller/')({
  component: SellerDashboardIndex,
});

function SellerDashboardIndex() {
  const { store, totalProducts, pendingOrders, isLoading } = useSellerOverview();
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-20 bg-muted rounded-lg" />
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-muted rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border p-6 rounded-lg shadow-sm">
        <h2 className="text-lg font-bold text-foreground mb-4">
          {t('seller.overview.welcome', { name: store?.name })}
        </h2>
        <p className="text-sm text-muted-foreground">{t('seller.overview.welcomeDesc')}</p>
      </div>

      <SellerSummaryCards totalProducts={totalProducts} pendingOrders={pendingOrders} />
    </div>
  );
}
