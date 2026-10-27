import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';

export interface UnifiedOrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface OrderItemsListProps {
  items: UnifiedOrderItem[];
  headerTitle?: string;
  headerIcon?: React.ReactNode;
  headerSubtitle?: React.ReactNode;
  className?: string;
}

export function OrderItemsList({
  items,
  headerTitle = 'Ordered Products',
  headerIcon,
  headerSubtitle,
  className,
}: OrderItemsListProps) {
  return (
    <Card className={`border border-border/80 shadow-sm overflow-hidden ${className || ''}`}>
      <div className="bg-muted/50 p-4 border-b border-border/80 flex items-center gap-2">
        {headerIcon}
        <div>
          {headerSubtitle && (
            <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block">
              {headerSubtitle}
            </span>
          )}
          <span className="text-sm font-bold text-foreground capitalize leading-none">
            {headerTitle}
          </span>
        </div>
      </div>
      <CardContent className="p-6 divide-y divide-border/60">
        {items.map((item) => (
          <div
            key={item.id}
            className="py-4 first:pt-0 last:pb-0 flex justify-between items-start gap-4"
          >
            <div className="space-y-1">
              <h4 className="font-semibold text-sm text-foreground leading-snug">{item.name}</h4>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(item.price)} × {item.quantity}
              </p>
            </div>
            <span className="font-bold text-sm text-foreground whitespace-nowrap">
              {formatCurrency(item.price * item.quantity)}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
