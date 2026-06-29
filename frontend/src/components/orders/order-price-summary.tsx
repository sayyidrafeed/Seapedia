import { Separator } from '@/components/ui/separator';

interface OrderPriceSummaryProps {
  subtotal: number;
  deliveryFee: number;
  ppn: number;
  totalAmount: number;
  deliveryMethod?: string;
}

export function OrderPriceSummary({
  subtotal,
  deliveryFee,
  ppn,
  totalAmount,
  deliveryMethod,
}: OrderPriceSummaryProps) {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(val);
  };

  const deliveryMethodLabels: Record<string, string> = {
    instant: 'Instant (Sameday)',
    next_day: 'Next Day (1 Day)',
    regular: 'Regular (2-3 Days)',
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
        Pricing Details
      </h3>
      <div className="space-y-2 text-sm text-muted-foreground">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span className="font-medium text-foreground">{formatCurrency(subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span className="flex items-center gap-1.5">
            Delivery Fee
            {deliveryMethod && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground font-medium uppercase">
                {deliveryMethodLabels[deliveryMethod] || deliveryMethod}
              </span>
            )}
          </span>
          <span className="font-medium text-foreground">{formatCurrency(deliveryFee)}</span>
        </div>
        <div className="flex justify-between">
          <span className="flex items-center gap-1">
            PPN <strong className="text-foreground">12%</strong>
          </span>
          <span className="font-medium text-foreground">{formatCurrency(ppn)}</span>
        </div>
      </div>
      <Separator />
      <div className="flex justify-between items-baseline pt-1">
        <span className="text-sm font-bold text-foreground">Total Bill</span>
        <span className="text-2xl font-black text-primary tracking-tight">
          {formatCurrency(totalAmount)}
        </span>
      </div>
    </div>
  );
}
