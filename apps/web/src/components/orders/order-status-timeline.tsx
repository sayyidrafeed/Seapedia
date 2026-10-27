import { CheckCircle2, Clock, Package, Truck, RefreshCw } from 'lucide-react';

interface StatusHistoryItem {
  id: string;
  status: string;
  note: string | null;
  createdAt: string;
}

interface OrderStatusTimelineProps {
  history: StatusHistoryItem[];
}

export function OrderStatusTimeline({ history }: OrderStatusTimelineProps) {
  const getIcon = (status: string) => {
    switch (status) {
      case 'sedang_dikemas':
        return <Package className="h-5 w-5" />;
      case 'menunggu_pengirim':
        return <Clock className="h-5 w-5" />;
      case 'sedang_dikirim':
        return <Truck className="h-5 w-5" />;
      case 'pesanan_selesai':
        return <CheckCircle2 className="h-5 w-5" />;
      case 'dikembalikan':
        return <RefreshCw className="h-5 w-5" />;
      default:
        return <Package className="h-5 w-5" />;
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      sedang_dikemas: 'Sedang Dikemas',
      menunggu_pengirim: 'Menunggu Pengirim (Sellers Processing)',
      sedang_dikirim: 'Sedang Dikirim',
      pesanan_selesai: 'Pesanan Selesai',
      dikembalikan: 'Pesanan Dikembalikan',
    };
    return labels[status] || status.toUpperCase();
  };

  const getIconColor = (index: number) => {
    return index === 0
      ? 'bg-primary text-primary-foreground border-primary'
      : 'bg-muted text-muted-foreground border-border';
  };

  return (
    <div className="space-y-6">
      <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
        Order Status Timeline
      </h3>
      {history.length === 0 ? (
        <p className="text-xs text-muted-foreground">No tracking updates available yet.</p>
      ) : (
        <div className="relative border-l border-border pl-6 ml-3.5 space-y-6">
          {history.map((item, idx) => {
            const dateStr = new Date(item.createdAt).toLocaleString('id-ID', {
              dateStyle: 'medium',
              timeStyle: 'short',
            });
            return (
              <div key={item.id} className="relative group">
                {/* Timeline node */}
                <div
                  className={`absolute -left-[35px] top-0.5 rounded-full border-4 p-1.5 z-10 transition-colors duration-200 ${getIconColor(
                    idx,
                  )}`}
                >
                  {getIcon(item.status)}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4
                      className={`text-sm font-bold ${
                        idx === 0 ? 'text-foreground font-black' : 'text-muted-foreground'
                      }`}
                    >
                      {getStatusLabel(item.status)}
                    </h4>
                    <span className="text-[10px] text-muted-foreground font-medium">{dateStr}</span>
                  </div>
                  {item.note && (
                    <p className="text-xs text-muted-foreground max-w-lg leading-relaxed">
                      {item.note}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
