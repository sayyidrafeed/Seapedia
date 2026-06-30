import { createFileRoute } from '@tanstack/react-router';
import { useSellerReport } from '@/features/seller/hooks/use-seller-report';
import { ReportKpiGrid } from '@/components/orders/report-kpi-grid';
import { OrderReportList } from '@/components/orders/order-report-list';
import type { ReportOrder } from '@/components/orders/order-report-list';
import { formatCurrency } from '@/lib/utils';

export const Route = createFileRoute('/dashboard/seller/report')({
  component: SellerIncomeReportPage,
});

function SellerIncomeReportPage() {
  const { report, isLoading, error } = useSellerReport();

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
        <p className="text-destructive font-semibold">Error loading income report.</p>
        <p className="text-sm text-muted-foreground">Please try again later.</p>
      </div>
    );
  }

  const card1 = {
    label: 'Total Revenue',
    value: formatCurrency(report.totalIncome),
    subtext: "Sum of subtotal from completed store's orders",
  };

  const card2 = {
    label: 'Completed Orders',
    value: report.totalOrders,
    subtext: 'Successfully delivered transactions',
  };

  const card3 = {
    label: 'Average Revenue',
    value: formatCurrency(report.averageRevenue),
    subtext: 'Average earnings per completed order',
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
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Income Report</h2>
        <p className="text-muted-foreground text-sm mt-1">
          A comprehensive breakdown of your store's completed revenue on Seapedia.
        </p>
      </div>

      {/* Summary Metrics */}
      <ReportKpiGrid card1={card1} card2={card2} card3={card3} />

      {/* Detailed Transactions */}
      <OrderReportList
        orders={mappedOrders}
        title="Revenue Breakdown"
        description="All store orders. Only completed transactions contribute to your store's revenue metrics above."
        detailLinkPrefix="seller"
        subtotalLabel="Subtotal (Revenue)"
        totalLabel="Buyer Paid (Total)"
        itemsLabel="Items sold:"
        showStoreName={false}
      />
    </div>
  );
}
