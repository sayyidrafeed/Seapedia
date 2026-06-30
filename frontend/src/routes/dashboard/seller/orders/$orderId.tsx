import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getSellerOrderDetailOptions,
  processSellerOrderMutation,
} from '@/lib/api/generated/@tanstack/react-query.gen';
import { OrderStatusBadge } from '@/components/orders/order-status-badge';
import { OrderPriceSummary } from '@/components/orders/order-price-summary';
import { OrderStatusTimeline } from '@/components/orders/order-status-timeline';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { ArrowLeft, MapPin, User, Calendar, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import type { ProcessSellerOrderError } from '@/lib/api/generated/types.gen';

import { Separator } from '@/components/ui/separator';

export const Route = createFileRoute('/dashboard/seller/orders/$orderId')({
  component: SellerOrderDetailPage,
});

function SellerOrderDetailPage() {
  const { orderId } = Route.useParams();
  const queryClient = useQueryClient();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [note, setNote] = useState('');

  const {
    data: order,
    isLoading,
    error,
  } = useQuery({
    ...getSellerOrderDetailOptions({
      path: { id: orderId },
    }),
    retry: false,
  });

  const processMutation = useMutation({
    ...processSellerOrderMutation(),
    onSuccess: () => {
      toast.success('Order processed successfully!');
      setIsModalOpen(false);
      setNote('');
      queryClient.invalidateQueries({
        queryKey: getSellerOrderDetailOptions({ path: { id: orderId } }).queryKey,
      });
    },
    onError: (err: ProcessSellerOrderError) => {
      const errorObj = err as unknown as { status?: number; message?: string };
      if (errorObj.status === 409) {
        toast.error('Concurrency Conflict: Order status has been updated by another process.');
        setIsModalOpen(false);
        setNote('');
        queryClient.invalidateQueries({
          queryKey: getSellerOrderDetailOptions({ path: { id: orderId } }).queryKey,
        });
      } else {
        toast.error(errorObj.message || 'Failed to process order');
      }
    },
  });

  const handleProcessOrder = () => {
    processMutation.mutate({
      path: { id: orderId },
      body: { note: note.trim() || undefined },
    });
  };

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
        <Link to="/dashboard/seller/orders">
          <Button size="sm">Back to Incoming Orders</Button>
        </Link>
      </div>
    );
  }

  const dateStr = new Date(order.createdAt).toLocaleString('id-ID', {
    dateStyle: 'long',
    timeStyle: 'short',
  });

  const address = order.addressSnapshot;

  return (
    <div className="container mx-auto px-6 py-8 max-w-5xl space-y-8">
      {/* Back navigation */}
      <Link
        to="/dashboard/seller/orders"
        className="inline-flex items-center text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors gap-2"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Incoming Orders
      </Link>

      {/* Title block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">
              Incoming Order Detail
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
          {/* Buyer shipping address */}
          <Card className="border border-border/80 shadow-sm overflow-hidden">
            <div className="bg-muted/50 p-4 border-b border-border/80 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
                Recipient & Shipping Address
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

          {/* Purchased products list */}
          <Card className="border border-border/80 shadow-sm overflow-hidden">
            <div className="bg-muted/50 p-4 border-b border-border/80 flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
                Ordered Products
              </h3>
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

            <div className="bg-muted/50 rounded-lg p-4 border border-border/80 space-y-2">
              <div className="flex items-center gap-1.5 text-xs text-foreground font-bold uppercase tracking-wider">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <span>Seller Actions</span>
              </div>
              {order.status === 'sedang_dikemas' ? (
                <>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    This order is ready to be prepared. Click below to pack and notify a driver for
                    shipment.
                  </p>
                  <Button
                    className="w-full mt-2 cursor-pointer font-bold bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-200"
                    onClick={() => setIsModalOpen(true)}
                  >
                    Process Order
                  </Button>
                </>
              ) : order.status === 'menunggu_pengirim' ? (
                <>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Order processed. Waiting for a driver to accept the shipment job.
                  </p>
                  <Button className="w-full mt-2" disabled variant="secondary">
                    Waiting for Driver
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    No action needed. Order is currently in status:{' '}
                    <strong className="text-foreground capitalize">
                      {order.status.replace('_', ' ')}
                    </strong>
                    .
                  </p>
                </>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Premium Glassmorphism Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-background border border-border/80 rounded-xl shadow-2xl w-full max-w-md overflow-hidden transform scale-100 transition-all duration-200 p-6 space-y-4">
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-foreground">Process Order</h3>
              <p className="text-xs text-muted-foreground">
                Move this order to <strong className="text-foreground">Menunggu Pengirim</strong>{' '}
                status so drivers can pick it up.
              </p>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="note-input"
                className="text-xs font-bold text-foreground uppercase tracking-wider block"
              >
                Optional Processing Note
              </label>
              <textarea
                id="note-input"
                className="w-full min-h-[80px] rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                placeholder="e.g. Package packed and ready in front of the store..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={1000}
                disabled={processMutation.isPending}
              />
              <p className="text-[10px] text-muted-foreground text-right">
                {note.length} / 1000 characters
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsModalOpen(false);
                  setNote('');
                }}
                disabled={processMutation.isPending}
                className="cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleProcessOrder}
                disabled={processMutation.isPending}
                className="cursor-pointer font-bold"
              >
                {processMutation.isPending ? 'Processing...' : 'Confirm Process'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
