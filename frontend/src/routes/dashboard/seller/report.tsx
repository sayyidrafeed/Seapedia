import { createFileRoute } from '@tanstack/react-router';
import { useSellerReport } from '@/features/seller/hooks/use-seller-report';
import { ReportKpiGrid } from '@/components/orders/report-kpi-grid';
import { OrderReportList } from '@/components/orders/order-report-list';
import type { ReportOrder } from '@/components/orders/order-report-list';
import { formatCurrency } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

export const Route = createFileRoute('/dashboard/seller/report')({
  component: SellerIncomeReportPage,
});

function SellerIncomeReportPage() {
  const { report, isLoading, error } = useSellerReport();
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-muted rounded w-1/4" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-32 bg-muted rounded-xl" />
          <div className="h-32 bg-muted rounded-xl" />
          <div className="h-32 bg-muted rounded-xl" />
        </div>
        <div className="h-96 bg-muted rounded-xl" />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="text-center py-12 space-y-4">
        <p className="text-destructive font-semibold">{t('seller.report.errorLoading')}</p>
        <p className="text-sm text-muted-foreground">{t('buyer.report.tryAgainLater')}</p>
      </div>
    );
  }

  const card1 = {
    label: t('seller.report.totalRevenue'),
    value: formatCurrency(report.totalIncome),
    subtext: t('seller.report.totalRevenueDesc'),
  };

  const card2 = {
    label: t('buyer.report.completedOrders'),
    value: report.totalOrders,
    subtext: t('buyer.report.completedOrdersDesc'),
  };

  const card3 = {
    label: t('seller.report.averageRevenue'),
    value: formatCurrency(report.averageRevenue),
    subtext: t('seller.report.averageRevenueDesc'),
  };

  const mappedOrders: ReportOrder[] = report.orders.map((o) => ({
    id: o.id,
    createdAt: o.createdAt,
    status: o.status,
    subtotal: o.subtotal,
    discountAmount: o.discountAmount,
    discountCode: o.discountCode as string | null,
    deliveryFee: o.deliveryFee,
    deliveryMethod: o.deliveryMethod,
    ppn: o.ppn,
    totalAmount: o.totalAmount,
    items: o.items.map((item) => ({
      id: item.id,
      productName: item.productName,
      productPrice: item.productPrice,
      quantity: item.quantity,
    })),
  }));

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          {t('seller.report.title')}
        </h2>
        <p className="text-muted-foreground text-sm mt-1">{t('seller.report.desc')}</p>
      </div>

      {/* Summary Metrics */}
      <ReportKpiGrid card1={card1} card2={card2} card3={card3} />

      {/* Detailed Transactions */}
      <OrderReportList
        orders={mappedOrders}
        title={t('seller.report.historyTitle')}
        description={t('seller.report.historyDesc')}
        detailLinkPrefix="seller"
        subtotalLabel={t('seller.report.subtotalLabel')}
        totalLabel={t('seller.report.totalLabel')}
        itemsLabel={t('seller.report.itemsLabel')}
        showStoreName={false}
      />
    </div>
  );
}
