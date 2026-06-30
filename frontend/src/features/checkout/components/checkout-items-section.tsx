import { OrderItemsList } from '@/components/orders/order-items-list';
import type { UnifiedOrderItem } from '@/components/orders/order-items-list';

interface CartItem {
  id: string;
  quantity: number;
  product: {
    name: string;
    price: number;
  };
}

interface CheckoutItemsSectionProps {
  items: CartItem[];
}

export function CheckoutItemsSection({ items }: CheckoutItemsSectionProps) {
  const unifiedItems: UnifiedOrderItem[] = items.map((item) => ({
    id: item.id,
    name: item.product.name,
    price: item.product.price,
    quantity: item.quantity,
  }));

  return (
    <OrderItemsList
      items={unifiedItems}
      headerTitle={`Order Items (${items.length})`}
      className="hover:border-primary/20 transition duration-200"
    />
  );
}
