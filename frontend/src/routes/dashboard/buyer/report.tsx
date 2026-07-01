import { createFileRoute } from '@tanstack/react-router';
import { useBuyerReport } from '@/features/buyer/hooks/use-buyer-report';
import { ReportKpiGrid } from '@/components/orders/report-kpi-grid';
import { OrderReportList } from '@/components/orders/order-report-list';
import type { ReportOrder } from '@/components/orders/order-report-list';
import { formatCurrency } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

export const Route = createFileRoute('/dashboard/buyer/report')({
  component: BuyerSpendingReportPage,
});

function BuyerSpendingReportPage() {
  const { t } = useTranslation();
  const { report, isLoading, error } = useBuyerReport();

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
        <p className="text-destructive font-semibold">{t('buyer.report.errorLoading')}</p>
        <p className="text-sm text-muted-foreground">{t('buyer.report.tryAgainLater')}</p>
      </div>
    );
  }

  const card1 = {
    label: t('buyer.report.totalExpenses'),
    value: formatCurrency(report.totalSpending),
    subtext: t('buyer.report.totalExpensesDesc'),
  };

  const card2 = {
    label: t('buyer.report.completedOrders'),
    value: report.totalOrders,
    subtext: t('buyer.report.completedOrdersDesc'),
  };

  const card3 = {
    label: t('buyer.report.avgOrderValue'),
    value: formatCurrency(report.averageOrderValue),
    subtext: t('buyer.report.avgOrderValueDesc'),
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
    storeName: o.storeName,
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
          {t('buyer.report.title')}
        </h2>
        <p className="text-muted-foreground text-sm mt-1">{t('buyer.report.desc')}</p>
      </div>

      {/* Summary Metrics */}
      <ReportKpiGrid card1={card1} card2={card2} card3={card3} />

      {/* Detailed Transactions */}
      <OrderReportList
        orders={mappedOrders}
        title={t('buyer.report.historyTitle')}
        description={t('buyer.report.historyDesc')}
        detailLinkPrefix="buyer"
        showStoreName={true}
      />
    </div>
  );
}
