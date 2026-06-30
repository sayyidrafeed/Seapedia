import type { ChartConfig } from '@/components/ui/chart';

export const ROLE_COLORS = {
  admin: 'var(--color-success)',
  buyer: 'var(--color-primary)',
  seller: 'var(--color-accent)',
  driver: 'var(--color-primary-400)',
};

export const ORDER_COLORS = {
  sedang_dikemas: 'var(--color-warning)',
  menunggu_pengirim: 'var(--color-primary-200)',
  sedang_dikirim: 'var(--color-primary-500)',
  pesanan_selesai: 'var(--color-success)',
  dikembalikan: 'var(--color-destructive)',
};

export const DELIVERY_COLORS = {
  pending: 'var(--color-warning)',
  taken: 'var(--color-primary-500)',
  completed: 'var(--color-success)',
};

export const roleChartConfig = {
  admin: { label: 'Admin', color: ROLE_COLORS.admin },
  buyer: { label: 'Buyer', color: ROLE_COLORS.buyer },
  seller: { label: 'Seller', color: ROLE_COLORS.seller },
  driver: { label: 'Driver', color: ROLE_COLORS.driver },
} satisfies ChartConfig;

export const orderChartConfig = {
  sedang_dikemas: { label: 'Sedang Dikemas', color: ORDER_COLORS.sedang_dikemas },
  menunggu_pengirim: { label: 'Menunggu Pengirim', color: ORDER_COLORS.menunggu_pengirim },
  sedang_dikirim: { label: 'Sedang Dikirim', color: ORDER_COLORS.sedang_dikirim },
  pesanan_selesai: { label: 'Pesanan Selesai', color: ORDER_COLORS.pesanan_selesai },
  dikembalikan: { label: 'Dikembalikan', color: ORDER_COLORS.dikembalikan },
} satisfies ChartConfig;

export const deliveryChartConfig = {
  pending: { label: 'Pending', color: DELIVERY_COLORS.pending },
  taken: { label: 'Taken', color: DELIVERY_COLORS.taken },
  completed: { label: 'Completed', color: DELIVERY_COLORS.completed },
} satisfies ChartConfig;
