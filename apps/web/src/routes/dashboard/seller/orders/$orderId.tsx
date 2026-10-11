import { createFileRoute, Link } from '@tanstack/react-router';
import { useSellerOrderDetail } from '@/features/seller/hooks/use-seller-order-detail';
import { OrderStatusBadge } from '@/components/orders/order-status-badge';
import { OrderPriceSummary } from '@/components/orders/order-price-summary';
import { OrderStatusTimeline } from '@/components/orders/order-status-timeline';
import { OrderAddressCard } from '@/components/orders/order-address-card';
import { OrderItemsList } from '@/components/orders/order-items-list';
import type { UnifiedOrderItem } from '@/components/orders/order-items-list';
import { OrderDetailSkeleton } from '@/components/orders/order-detail-skeleton';
import { SellerOrderActions } from '@/features/seller/components/seller-order-actions';
import { ProcessOrderModal } from '@/features/seller/components/process-order-modal';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, User, Calendar } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useTranslation } from 'react-i18next';

export const Route = createFileRoute('/dashboard/seller/orders/$orderId')({
  component: SellerOrderDetailPage,
});

function SellerOrderDetailPage() {
  const { orderId } = Route.useParams();
  const { t } = useTranslation();

  const {
    order,
    isLoading,
    error,
    isModalOpen,
    note,
    isProcessing,
    setIsModalOpen,
    setNote,
    processOrder,
  } = useSellerOrderDetail(orderId);

  if (isLoading) {
    return <OrderDetailSkeleton />;
  }

  if (error || !order) {
    return (
      <div className="container mx-auto px-6 py-8 max-w-5xl text-center space-y-4">
        <p className="text-sm text-destructive font-semibold">
          {t('buyer.orders.errorLoadingDetails')}
        </p>
        <Link to="/dashboard/seller/orders">
          <Button size="sm">{t('seller.orders.backToOrders')}</Button>
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

  const userIconHeader = <User className="h-5 w-5 text-primary" />;

  return (
    <div className="container mx-auto px-6 py-8 max-w-5xl space-y-8">
      {/* Back navigation */}
      <Link
        to="/dashboard/seller/orders"
        className="inline-flex items-center text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors gap-2"
      >
        <ArrowLeft className="h-4 w-4" /> {t('seller.orders.backToOrders')}
      </Link>

      {/* Title block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">
              {t('seller.orders.detailTitle')}
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
          {/* Buyer shipping address */}
          <OrderAddressCard address={address} title={t('seller.orders.shippingAddressCard')} />

          {/* Purchased products list */}
          <OrderItemsList
            items={unifiedItems}
            headerTitle={t('seller.orders.orderedProducts')}
            headerIcon={userIconHeader}
          />

          {/* Status Timeline */}
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

            <SellerOrderActions status={order.status} onProcessClick={() => setIsModalOpen(true)} />
          </Card>
        </div>
      </div>

      <ProcessOrderModal
        isOpen={isModalOpen}
        note={note}
        isPending={isProcessing}
        onNoteChange={setNote}
        onClose={() => {
          setIsModalOpen(false);
          setNote('');
        }}
        onConfirm={processOrder}
      />
    </div>
  );
}
