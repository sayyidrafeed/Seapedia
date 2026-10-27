import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { getBuyerOrderDetailOptions } from '@/lib/api/generated/@tanstack/react-query.gen';
import { OrderStatusBadge } from '@/components/orders/order-status-badge';
import { OrderPriceSummary } from '@/components/orders/order-price-summary';
import { OrderStatusTimeline } from '@/components/orders/order-status-timeline';
import { OrderAddressCard } from '@/components/orders/order-address-card';
import { OrderItemsList } from '@/components/orders/order-items-list';
import type { UnifiedOrderItem } from '@/components/orders/order-items-list';
import { OrderDetailSkeleton } from '@/components/orders/order-detail-skeleton';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Store, Calendar, CreditCard } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useTranslation } from 'react-i18next';

export const Route = createFileRoute('/dashboard/buyer/orders/$orderId')({
  component: BuyerOrderDetailPage,
});

function BuyerOrderDetailPage() {
  const { t } = useTranslation();
  const { orderId } = Route.useParams();

  const {
    data: order,
    isLoading,
    error,
  } = useQuery({
    ...getBuyerOrderDetailOptions({
      path: { id: orderId },
    }),
    retry: false,
  });

  if (isLoading) {
    return <OrderDetailSkeleton />;
  }

  if (error || !order) {
    return (
      <div className="container mx-auto px-6 py-8 max-w-5xl text-center space-y-4">
        <p className="text-sm text-destructive font-semibold">
          {t('buyer.orders.errorLoadingDetails')}
        </p>
        <Link to="/dashboard/buyer/orders">
          <Button size="sm">{t('buyer.orders.backToOrders')}</Button>
        </Link>
      </div>
    );
  }

  const dateStr = new Date(order.createdAt).toLocaleString('id-ID', {
    dateStyle: 'long',
    timeStyle: 'short',
  });

  const address = order.addressSnapshot;

  const unifiedItems: UnifiedOrderItem[] = order.items.map((item) => ({
    id: item.id,
    name: item.productName,
    price: item.productPrice,
    quantity: item.quantity,
  }));

  const storeIconHeader = <Store className="h-5 w-5 text-primary" />;

  return (
    <div className="container mx-auto px-6 py-8 max-w-5xl space-y-8">
      {/* Back navigation */}
      <Link
        to="/dashboard/buyer/orders"
        className="inline-flex items-center text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors gap-2"
      >
        <ArrowLeft className="h-4 w-4" /> {t('buyer.orders.backToOrders')}
      </Link>

      {/* Title block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">
              {t('buyer.orders.orderDetail')}
            </h1>
            <span className="text-xs font-mono font-bold bg-muted px-2.5 py-1 rounded border border-border/80 text-muted-foreground">
              #{order.id.toUpperCase()}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            <span>{t('buyer.orders.placedOn', { date: dateStr })}</span>
          </div>
        </div>
        <div>
          <OrderStatusBadge status={order.status} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Columns */}
        <div className="lg:col-span-2 space-y-6">
          {/* Shipping Address Details */}
          <OrderAddressCard address={address} title={t('buyer.orders.shippingDestinationCard')} />

          {/* Items Purchased List */}
          <OrderItemsList
            items={unifiedItems}
            headerTitle={order.storeName}
            headerIcon={storeIconHeader}
            headerSubtitle={t('buyer.orders.storeSubtitle')}
          />

          {/* Chronological Status Timeline */}
          <Card className="border border-border/80 shadow-sm p-6">
            <OrderStatusTimeline
              history={(order.statusHistory || []).map((sh) => ({
                id: sh.id,
                status: sh.status,
                note: sh.note as string | null,
                createdAt: sh.createdAt,
              }))}
            />
          </Card>
        </div>

        {/* Sidebar Summary */}
        <div className="space-y-6">
          <Card className="border border-border/80 shadow-sm p-6 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-border/60">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                <span className="text-sm font-semibold text-foreground">
                  {t('buyer.orders.paymentMethod')}
                </span>
              </div>
              <span className="text-sm text-muted-foreground font-semibold">
                {t('buyer.wallet.title')}
              </span>
            </div>

            <OrderPriceSummary
              subtotal={order.subtotal}
              discountAmount={order.discountAmount}
              discountCode={order.discountCode as string | null}
              discountType={order.discountType as string | null}
              deliveryFee={order.deliveryFee}
              ppn={order.ppn}
              totalAmount={order.totalAmount}
              deliveryMethod={order.deliveryMethod}
            />

            <Separator />
            <p className="text-[10px] text-center text-muted-foreground leading-relaxed">
              {t('buyer.orders.orderReferences', { id: order.id })}
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
