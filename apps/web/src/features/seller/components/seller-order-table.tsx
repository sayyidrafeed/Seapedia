import { Link } from '@tanstack/react-router';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { OrderStatusBadge } from '@/components/orders/order-status-badge';
import { formatCurrency } from '@/lib/utils';
import { ArrowRight, PackageCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface SellerOrder {
  id: string;
  createdAt: string;
  status: string;
  deliveryMethod: string;
  totalAmount: number;
  items: unknown[];
}

interface SellerOrderTableProps {
  orders: SellerOrder[];
  processingOrderId: string | null;
  onProcessOrder: (id: string) => void;
}

export function SellerOrderTable({
  orders,
  processingOrderId,
  onProcessOrder,
}: SellerOrderTableProps) {
  const { t } = useTranslation();

  return (
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
                  <span>{t('seller.orders.placedOn', { date: dateStr })}</span>
                  <span>•</span>
                  <span>
                    {t('seller.orders.delivery')}{' '}
                    <span className="uppercase text-foreground font-semibold">
                      {order.deliveryMethod}
                    </span>
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {t('seller.orders.productsPurchased', { count: order.items.length })}
                </p>
              </div>

              <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto border-t md:border-t-0 pt-4 md:pt-0 border-border/60">
                <div className="text-left md:text-right">
                  <span className="text-xs text-muted-foreground block">
                    {t('seller.orders.orderValue')}
                  </span>
                  <span className="font-extrabold text-lg text-primary">
                    {formatCurrency(order.totalAmount)}
                  </span>
                </div>
                {order.status === 'sedang_dikemas' ? (
                  <Button
                    variant="default"
                    size="sm"
                    className="cursor-pointer gap-1.5"
                    onClick={() => onProcessOrder(order.id)}
                    disabled={processingOrderId === order.id}
                  >
                    <PackageCheck className="h-4 w-4" />
                    {processingOrderId === order.id
                      ? t('seller.orders.processing')
                      : t('seller.orders.processButton')}
                  </Button>
                ) : (
                  <Link to="/dashboard/seller/orders/$orderId" params={{ orderId: order.id }}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="cursor-pointer gap-1.5 hover:bg-primary hover:text-primary-foreground"
                    >
                      {t('buyer.orders.viewDetails')} <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
