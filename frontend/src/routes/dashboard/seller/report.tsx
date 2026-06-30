import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { getSellerIncomeReportOptions } from '@/lib/api/generated/@tanstack/react-query.gen';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import {
  DollarSign,
  ShoppingBag,
  Calculator,
  Calendar,
  Store,
  ArrowRight,
  Tag,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { OrderStatusBadge } from '@/components/orders/order-status-badge';

export const Route = createFileRoute('/dashboard/seller/report')({
  component: SellerIncomeReportPage,
});

function SellerIncomeReportPage() {
  const {
    data: report,
    isLoading,
    error,
  } = useQuery({
    ...getSellerIncomeReportOptions(),
    retry: false,
  });

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

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Income Report</h2>
        <p className="text-muted-foreground text-sm mt-1">
          A comprehensive breakdown of your store's completed revenue on Seapedia.
        </p>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border border-border/80 shadow-sm relative overflow-hidden bg-gradient-to-br from-background to-primary/5">
          <div className="absolute right-4 top-4 text-primary/10">
            <DollarSign className="h-16 w-16" />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase tracking-wider font-bold">
              Total Revenue
            </CardDescription>
            <CardTitle className="text-3xl font-black tracking-tight text-primary">
              {formatCurrency(report.totalIncome)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Sum of subtotal from completed orders</p>
          </CardContent>
        </Card>

        <Card className="border border-border/80 shadow-sm relative overflow-hidden">
          <div className="absolute right-4 top-4 text-muted-foreground/10">
            <ShoppingBag className="h-16 w-16" />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase tracking-wider font-bold">
              Completed Orders
            </CardDescription>
            <CardTitle className="text-3xl font-black tracking-tight text-foreground">
              {report.totalOrders}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Successfully delivered transactions</p>
          </CardContent>
        </Card>

        <Card className="border border-border/80 shadow-sm relative overflow-hidden">
          <div className="absolute right-4 top-4 text-muted-foreground/10">
            <Calculator className="h-16 w-16" />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase tracking-wider font-bold">
              Average Revenue
            </CardDescription>
            <CardTitle className="text-3xl font-black tracking-tight text-foreground">
              {formatCurrency(report.averageRevenue)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Average earnings per completed order</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Transactions */}
      <Card className="border border-border/80 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-bold">Revenue Breakdown</CardTitle>
          <CardDescription>
            All store orders. Only completed transactions contribute to your store's revenue metrics
            above.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {report.orders.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              No transactions found.
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {report.orders.map((order) => {
                const dateStr = new Date(order.createdAt).toLocaleString('id-ID', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                });

                return (
                  <div key={order.id} className="p-6 hover:bg-muted/30 transition-colors space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      {/* Left Block */}
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Store className="h-4 w-4 text-muted-foreground" />
                          <span className="font-bold text-foreground text-sm">Order ID</span>
                          <span className="text-[10px] font-mono bg-muted px-2 py-0.5 rounded text-muted-foreground">
                            #{order.id.substring(0, 8).toUpperCase()}
                          </span>
                          <OrderStatusBadge status={order.status} />
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>Placed on: {dateStr}</span>
                        </div>
                      </div>

                      {/* Right Block */}
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <span className="text-xs text-muted-foreground block">
                            Your Revenue (Subtotal)
                          </span>
                          <span className="font-extrabold text-foreground text-base">
                            {formatCurrency(order.subtotal)}
                          </span>
                        </div>
                        <Link to="/dashboard/seller/orders/$orderId" params={{ orderId: order.id }}>
                          <Badge
                            variant="outline"
                            className="h-8 hover:bg-primary hover:text-primary-foreground cursor-pointer gap-1 transition-all"
                          >
                            Details <ArrowRight className="h-3 w-3" />
                          </Badge>
                        </Link>
                      </div>
                    </div>

                    {/* Financial Breakdown Table */}
                    <div className="bg-muted/40 rounded-lg p-4 grid grid-cols-2 sm:grid-cols-5 gap-4 text-xs">
                      <div>
                        <span className="text-muted-foreground block mb-0.5">
                          Subtotal (Revenue)
                        </span>
                        <span className="font-bold text-primary">
                          {formatCurrency(order.subtotal)}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block mb-0.5">Buyer Discount</span>
                        <span className="font-bold text-destructive flex items-center gap-1 flex-wrap">
                          -{formatCurrency(order.discountAmount)}
                          {typeof order.discountCode === 'string' && order.discountCode && (
                            <Badge
                              variant="secondary"
                              className="px-1.5 py-0 text-[10px] font-mono h-4"
                            >
                              <Tag className="h-2 w-2 mr-0.5" /> {order.discountCode}
                            </Badge>
                          )}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block mb-0.5">Delivery Fee</span>
                        <span className="font-bold text-foreground">
                          {formatCurrency(order.deliveryFee)}
                          <span className="text-[10px] text-muted-foreground capitalize block font-normal">
                            ({order.deliveryMethod})
                          </span>
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block mb-0.5">PPN 12%</span>
                        <span className="font-bold text-foreground">
                          {formatCurrency(order.ppn)}
                        </span>
                      </div>
                      <div className="col-span-2 sm:col-span-1 border-t sm:border-t-0 sm:border-l border-border/80 pt-2 sm:pt-0 sm:pl-4">
                        <span className="text-muted-foreground block mb-0.5">
                          Buyer Paid (Total)
                        </span>
                        <span className="font-extrabold text-foreground text-sm">
                          {formatCurrency(order.totalAmount)}
                        </span>
                      </div>
                    </div>

                    {/* Ordered Items List */}
                    <div className="text-xs text-muted-foreground pl-1 space-y-1">
                      <span className="font-semibold block text-foreground/80 mb-1">
                        Items sold:
                      </span>
                      {order.items.map((item) => (
                        <div key={item.id} className="flex justify-between max-w-md">
                          <span>
                            • {item.productName} (x{item.quantity})
                          </span>
                          <span className="font-medium text-foreground/75">
                            {formatCurrency(item.productPrice * item.quantity)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
