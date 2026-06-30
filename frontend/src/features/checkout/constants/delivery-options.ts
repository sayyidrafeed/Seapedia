export const deliveryFeeOptions = [
  {
    value: 'instant' as const,
    label: 'Instant Delivery',
    time: 'Sameday delivery',
    price: 30000,
  },
  {
    value: 'next_day' as const,
    label: 'Next Day Delivery',
    time: 'Arrives tomorrow',
    price: 15000,
  },
  {
    value: 'regular' as const,
    label: 'Regular Delivery',
    time: '2-3 business days',
    price: 10000,
  },
] as const;

export type DeliveryMethod = 'instant' | 'next_day' | 'regular';
