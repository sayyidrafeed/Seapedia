import { createFileRoute, Link } from '@tanstack/react-router';
import { useBuyerOrders } from '@/features/buyer/hooks/use-buyer-orders';
import { OrderStatusBadge } from '@/components/orders/order-status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { ClipboardList, ArrowRight, ShoppingBag } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const Route = createFileRoute('/dashboard/buyer/orders/')({
  component: BuyerOrderHistoryPage,
});

function BuyerOrderHistoryPage() {
  const { t } = useTranslation();
  const { orders, isLoading, error } = useBuyerOrders();

  if (isLoading) {
    return (
      <div className="container mx-auto px-6 py-8 max-w-5xl animate-pulse space-y-6">
        <div className="h-10 bg-muted rounded w-1/4" />
        <div className="space-y-4">
          <div className="h-24 bg-muted rounded-xl" />
          <div className="h-24 bg-muted rounded-xl" />
          <div className="h-24 bg-muted rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !orders) {
    return (
      <div className="container mx-auto px-6 py-8 max-w-5xl text-center text-sm text-destructive">
        {t('buyer.orders.errorLoadingDetails')}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8 max-w-5xl space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
          {t('buyer.orders.title')}
        </h1>
        <p className="text-sm text-muted-foreground">{t('buyer.orders.desc')}</p>
      </div>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center border border-dashed border-border rounded-2xl bg-card/30">
          <div className="rounded-full bg-primary/10 p-6 text-primary mb-6">
            <ClipboardList className="h-12 w-12" />
          </div>
          <h3 className="text-xl font-bold text-foreground">{t('buyer.orders.noOrders')}</h3>
          <p className="text-sm text-muted-foreground mt-2 max-w-sm">
            {t('buyer.orders.noOrdersDesc')}
          </p>
          <Link to="/" className="mt-6">
            <Button size="sm" className="cursor-pointer">
              <ShoppingBag className="mr-2 h-4 w-4" /> {t('buyer.orders.startShopping')}
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const dateStr = new Date(order.createdAt).toLocaleDateString('id-ID', {
              dateStyle: 'medium',
            });
            const orderIdTrunc = order.id.slice(0, 8).toUpperCase();

            return (
              <Card
                key={order.id}
                className="border border-border/80 shadow-sm hover:border-primary/20 hover:shadow-md transition duration-200 overflow-hidden"
              >
                <CardContent className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="text-xs font-mono font-bold text-muted-foreground">
                        #{orderIdTrunc}
                      </span>
                      <OrderStatusBadge status={order.status} />
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>
                        {t('buyer.orders.store')}{' '}
                        <strong className="text-foreground capitalize">{order.storeName}</strong>
                      </span>
                      <span>•</span>
                      <span>{t('buyer.orders.placedOn', { date: dateStr })}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {t('buyer.orders.itemsPurchased', { count: order.items.length })}
                    </p>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto border-t md:border-t-0 pt-4 md:pt-0 border-border/60">
                    <div className="text-left md:text-right">
                      <span className="text-xs text-muted-foreground block">
                        {t('buyer.orders.totalPaid')}
                      </span>
                      <span className="font-extrabold text-lg text-primary">
                        {formatCurrency(order.totalAmount)}
                      </span>
                    </div>
                    <Link to="/dashboard/buyer/orders/$orderId" params={{ orderId: order.id }}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="cursor-pointer gap-1.5 hover:bg-primary hover:text-primary-foreground"
                      >
                        {t('buyer.orders.viewDetails')} <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
