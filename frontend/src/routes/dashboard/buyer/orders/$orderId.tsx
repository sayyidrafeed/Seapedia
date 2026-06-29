import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { getBuyerOrderDetailOptions } from '@/lib/api/generated/@tanstack/react-query.gen';
import { OrderStatusBadge } from '@/components/orders/order-status-badge';
import { OrderPriceSummary } from '@/components/orders/order-price-summary';
import { OrderStatusTimeline } from '@/components/orders/order-status-timeline';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { ArrowLeft, MapPin, Store, Calendar, CreditCard } from 'lucide-react';

import { Separator } from '@/components/ui/separator';

export const Route = createFileRoute('/dashboard/buyer/orders/$orderId')({
  component: BuyerOrderDetailPage,
});

function BuyerOrderDetailPage() {
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
    return (
      <div className="container mx-auto px-6 py-8 max-w-5xl animate-pulse space-y-6">
        <div className="h-6 bg-muted rounded w-1/6" />
        <div className="h-10 bg-muted rounded w-1/3" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-40 bg-muted rounded-xl" />
            <div className="h-60 bg-muted rounded-xl" />
          </div>
          <div className="h-80 bg-muted rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container mx-auto px-6 py-8 max-w-5xl text-center space-y-4">
        <p className="text-sm text-destructive font-semibold">Error loading order details.</p>
        <Link to="/dashboard/buyer/orders">
          <Button size="sm">Back to Orders</Button>
        </Link>
      </div>
    );
  }

  const dateStr = new Date(order.createdAt).toLocaleString('id-ID', {
    dateStyle: 'long',
    timeStyle: 'short',
  });

  const address = order.addressSnapshot as unknown as {
    recipientName: string;
    label: string;
    phoneNumber: string;
    fullAddress: string;
    district: string;
    city: string;
    province: string;
    postalCode: string;
  };

  return (
    <div className="container mx-auto px-6 py-8 max-w-5xl space-y-8">
      {/* Back navigation */}
      <Link
        to="/dashboard/buyer/orders"
        className="inline-flex items-center text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors gap-2"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Orders
      </Link>

      {/* Title block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">
              Order Detail
            </h1>
            <span className="text-xs font-mono font-bold bg-muted px-2.5 py-1 rounded border border-border/80 text-muted-foreground">
              #{order.id.toUpperCase()}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            <span>Placed on {dateStr}</span>
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
          <Card className="border border-border/80 shadow-sm overflow-hidden">
            <div className="bg-muted/50 p-4 border-b border-border/80 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
                Shipping Destination
              </h3>
            </div>
            <CardContent className="p-6 space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-foreground text-base">{address.recipientName}</span>
                <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full font-semibold">
                  {address.label}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{address.phoneNumber}</p>
              <p className="text-sm text-foreground leading-relaxed">
                {address.fullAddress}, {address.district}, {address.city}, {address.province} -{' '}
                {address.postalCode}
              </p>
            </CardContent>
          </Card>

          {/* Items Purchased List */}
          <Card className="border border-border/80 shadow-sm overflow-hidden">
            <div className="bg-muted/50 p-4 border-b border-border/80 flex items-center gap-2">
              <Store className="h-5 w-5 text-primary" />
              <div>
                <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block">
                  Store name
                </span>
                <span className="text-sm font-bold text-foreground capitalize leading-none">
                  {order.storeName}
                </span>
              </div>
            </div>
            <CardContent className="p-6 divide-y divide-border/60">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="py-4 first:pt-0 last:pb-0 flex justify-between items-start gap-4"
                >
                  <div className="space-y-1">
                    <h4 className="font-semibold text-sm text-foreground leading-snug">
                      {item.productName}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(item.productPrice)} × {item.quantity}
                    </p>
                  </div>
                  <span className="font-bold text-sm text-foreground whitespace-nowrap">
                    {formatCurrency(item.productPrice * item.quantity)}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

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
                <span className="text-sm font-bold text-foreground font-semibold">
                  Payment Method
                </span>
              </div>
              <span className="text-sm text-muted-foreground font-semibold">Seapedia Wallet</span>
            </div>

            <OrderPriceSummary
              subtotal={order.subtotal}
              deliveryFee={order.deliveryFee}
              ppn={order.ppn}
              totalAmount={order.totalAmount}
              deliveryMethod={order.deliveryMethod}
            />

            <Separator />
            <p className="text-[10px] text-center text-muted-foreground leading-relaxed">
              Order references: #{order.id}
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
