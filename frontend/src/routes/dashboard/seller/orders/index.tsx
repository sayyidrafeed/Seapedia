import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listSellerOrdersOptions,
  processSellerOrderMutation,
} from '@/lib/api/generated/@tanstack/react-query.gen';
import { OrderStatusBadge } from '@/components/orders/order-status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { ClipboardList, ArrowRight, PackageCheck } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import type { ProcessSellerOrderError } from '@/lib/api/generated/types.gen';

export const Route = createFileRoute('/dashboard/seller/orders/')({
  component: SellerIncomingOrdersPage,
});

function SellerIncomingOrdersPage() {
  const queryClient = useQueryClient();
  const [processingOrderId, setProcessingOrderId] = useState<string | null>(null);

  const processMutation = useMutation({
    ...processSellerOrderMutation(),
    onSuccess: () => {
      toast.success('Order processed successfully!');
      setProcessingOrderId(null);
      queryClient.invalidateQueries({ queryKey: listSellerOrdersOptions().queryKey });
    },
    onError: (err: ProcessSellerOrderError) => {
      const errorObj = err as unknown as { status?: number; message?: string };
      if (errorObj.status === 409) {
        toast.error('This order has already been processed by another process.');
      } else {
        toast.error(errorObj.message || 'Failed to process order');
      }
      setProcessingOrderId(null);
      queryClient.invalidateQueries({ queryKey: listSellerOrdersOptions().queryKey });
    },
  });

  const {
    data: orders,
    isLoading,
    error,
  } = useQuery({
    ...listSellerOrdersOptions(),
    retry: false,
  });

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
        Error loading incoming orders. Please check if your store is created properly.
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8 max-w-5xl space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Incoming Orders</h1>
        <p className="text-sm text-muted-foreground">
          Manage and process orders placed at your store
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center border border-dashed border-border rounded-2xl bg-card/30">
          <div className="rounded-full bg-primary/10 p-6 text-primary mb-6">
            <ClipboardList className="h-12 w-12" />
          </div>
          <h3 className="text-xl font-bold text-foreground">No incoming orders yet</h3>
          <p className="text-sm text-muted-foreground mt-2 max-w-sm">
            When buyers purchase products from your store, their orders will appear here. Keep up
            the good work!
          </p>
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
                      <span>Placed on: {dateStr}</span>
                      <span>•</span>
                      <span>
                        Delivery:{' '}
                        <span className="uppercase text-foreground font-semibold">
                          {order.deliveryMethod}
                        </span>
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {order.items.length} product{order.items.length > 1 ? 's' : ''} purchased
                    </p>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto border-t md:border-t-0 pt-4 md:pt-0 border-border/60">
                    <div className="text-left md:text-right">
                      <span className="text-xs text-muted-foreground block">Order Value</span>
                      <span className="font-extrabold text-lg text-primary">
                        {formatCurrency(order.totalAmount)}
                      </span>
                    </div>
                    {order.status === 'sedang_dikemas' ? (
                      <Button
                        variant="default"
                        size="sm"
                        className="cursor-pointer gap-1.5"
                        onClick={() => setProcessingOrderId(order.id)}
                        disabled={processingOrderId === order.id}
                      >
                        <PackageCheck className="h-4 w-4" />
                        {processingOrderId === order.id ? 'Processing...' : 'Process'}
                      </Button>
                    ) : (
                      <Link to="/dashboard/seller/orders/$orderId" params={{ orderId: order.id }}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="cursor-pointer gap-1.5 hover:bg-primary hover:text-primary-foreground"
                        >
                          View Details <ArrowRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {processingOrderId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-background border border-border/80 rounded-xl shadow-2xl w-full max-w-sm overflow-hidden transform scale-100 transition-all duration-200 p-6 space-y-4">
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-foreground">Process Order</h3>
              <p className="text-sm text-muted-foreground">
                Move this order to <strong className="text-foreground">Menunggu Pengirim</strong>{' '}
                status so drivers can pick it up.
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setProcessingOrderId(null)}
                disabled={processMutation.isPending}
                className="cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() =>
                  processMutation.mutate({
                    path: { id: processingOrderId },
                    body: {},
                  })
                }
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
