import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Store, ArrowRight, Tag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { OrderStatusBadge } from '@/components/orders/order-status-badge';
import { formatCurrency } from '@/lib/utils';
import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

export interface ReportOrderItem {
  id: string;
  productName: string;
  productPrice: number;
  quantity: number;
}

export interface ReportOrder {
  id: string;
  createdAt: string;
  status: string;
  subtotal: number;
  discountAmount: number;
  discountCode?: string | null;
  deliveryFee: number;
  deliveryMethod: string;
  ppn: number;
  totalAmount: number;
  storeName?: string;
  items: ReportOrderItem[];
}

interface OrderReportListProps {
  orders: ReportOrder[];
  title: string;
  description: string;
  detailLinkPrefix: 'buyer' | 'seller'; // To construct the TanStack Link params safely
  subtotalLabel?: string;
  totalLabel?: string;
  itemsLabel?: string;
  showStoreName?: boolean;
}

export function OrderReportList({
  orders,
  title,
  description,
  detailLinkPrefix,
  subtotalLabel,
  totalLabel,
  itemsLabel,
  showStoreName = false,
}: OrderReportListProps) {
  const { t } = useTranslation();
  const subtotalLabelVal = subtotalLabel || t('buyer.checkout.subtotal');
  const totalLabelVal = totalLabel || t('buyer.checkout.total');
  const itemsLabelVal = itemsLabel || t('buyer.checkout.items');

  return (
    <Card className="border border-border/80 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-bold">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {orders.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">
            {t('buyer.report.noTransactions')}
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {orders.map((order) => {
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
                        <span className="font-bold text-foreground text-sm capitalize">
                          {showStoreName && order.storeName
                            ? order.storeName
                            : t('buyer.orders.orderIdLabel')}
                        </span>
                        <span className="text-[10px] font-mono bg-muted px-2 py-0.5 rounded text-muted-foreground">
                          #{order.id.substring(0, 8).toUpperCase()}
                        </span>
                        <OrderStatusBadge status={order.status} />
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>
                          {showStoreName ? dateStr : t('buyer.orders.placedOn', { date: dateStr })}
                        </span>
                      </div>
                    </div>

                    {/* Right Block */}
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="text-xs text-muted-foreground block">
                          {showStoreName
                            ? t('buyer.checkout.totalAmount')
                            : t('seller.report.totalRevenue')}
                        </span>
                        <span className="font-extrabold text-foreground text-base">
                          {formatCurrency(showStoreName ? order.totalAmount : order.subtotal)}
                        </span>
                      </div>
                      {detailLinkPrefix === 'buyer' ? (
                        <Link to="/dashboard/buyer/orders/$orderId" params={{ orderId: order.id }}>
                          <Badge
                            variant="outline"
                            className="h-8 hover:bg-primary hover:text-primary-foreground cursor-pointer gap-1 transition-all"
                          >
                            {t('buyer.orders.viewDetails')} <ArrowRight className="h-3 w-3" />
                          </Badge>
                        </Link>
                      ) : (
                        <Link to="/dashboard/seller/orders/$orderId" params={{ orderId: order.id }}>
                          <Badge
                            variant="outline"
                            className="h-8 hover:bg-primary hover:text-primary-foreground cursor-pointer gap-1 transition-all"
                          >
                            {t('buyer.orders.viewDetails')} <ArrowRight className="h-3 w-3" />
                          </Badge>
                        </Link>
                      )}
                    </div>
                  </div>

                  {/* Financial Breakdown Table */}
                  <div className="bg-muted/40 rounded-lg p-4 grid grid-cols-2 sm:grid-cols-5 gap-4 text-xs">
                    <div>
                      <span className="text-muted-foreground block mb-0.5">{subtotalLabelVal}</span>
                      <span className="font-bold text-foreground">
                        {formatCurrency(order.subtotal)}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block mb-0.5">
                        {showStoreName
                          ? t('buyer.checkout.discount')
                          : t('buyer.checkout.discount')}
                      </span>
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
                      <span className="text-muted-foreground block mb-0.5">
                        {t('buyer.checkout.deliveryFee')}
                      </span>
                      <span className="font-bold text-foreground">
                        {formatCurrency(order.deliveryFee)}
                        <span className="text-[10px] text-muted-foreground capitalize block font-normal">
                          ({order.deliveryMethod})
                        </span>
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block mb-0.5">PPN 12%</span>
                      <span className="font-bold text-foreground">{formatCurrency(order.ppn)}</span>
                    </div>
                    <div className="col-span-2 sm:col-span-1 border-t sm:border-t-0 sm:border-l border-border/80 pt-2 sm:pt-0 sm:pl-4">
                      <span className="text-muted-foreground block mb-0.5">{totalLabelVal}</span>
                      <span className="font-black text-primary text-sm">
                        {formatCurrency(order.totalAmount)}
                      </span>
                    </div>
                  </div>

                  {/* Ordered Items List */}
                  <div className="text-xs text-muted-foreground pl-1 space-y-1">
                    <span className="font-semibold block text-foreground/80 mb-1">
                      {itemsLabelVal}
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
  );
}
