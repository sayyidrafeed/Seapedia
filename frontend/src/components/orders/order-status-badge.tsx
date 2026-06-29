import { Badge } from '@/components/ui/badge';

interface OrderStatusBadgeProps {
  status: string;
}

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  const statusMap: Record<string, { label: string; className: string }> = {
    sedang_dikemas: {
      label: 'Sedang Dikemas',
      className:
        'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800',
    },
    menunggu_pengirim: {
      label: 'Menunggu Pengirim',
      className:
        'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800',
    },
    sedang_dikirim: {
      label: 'Sedang Dikirim',
      className:
        'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800',
    },
    pesanan_selesai: {
      label: 'Selesai',
      className:
        'bg-green-500/10 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800',
    },
    dikembalikan: {
      label: 'Dikembalikan',
      className: 'bg-destructive/10 text-destructive border-destructive/20',
    },
  };

  const config = statusMap[status] || {
    label: status.toUpperCase(),
    className: 'bg-muted text-muted-foreground',
  };

  return (
    <Badge
      variant="outline"
      className={`font-semibold capitalize px-2.5 py-0.5 rounded-full ${config.className}`}
    >
      {config.label}
    </Badge>
  );
}
