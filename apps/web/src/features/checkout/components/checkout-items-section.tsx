import { OrderItemsList } from '@/components/orders/order-items-list';
import type { UnifiedOrderItem } from '@/components/orders/order-items-list';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
  const unifiedItems: UnifiedOrderItem[] = items.map((item) => ({
    id: item.id,
    name: item.product.name,
    price: item.product.price,
    quantity: item.quantity,
  }));

  return (
    <OrderItemsList
      items={unifiedItems}
      headerTitle={t('buyer.checkout.orderItems', { count: items.length })}
      className="hover:border-primary/20 transition duration-200"
    />
  );
}
