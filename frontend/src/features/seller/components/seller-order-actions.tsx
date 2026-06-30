import { Button } from '@/components/ui/button';
import { ShieldCheck } from 'lucide-react';

interface SellerOrderActionsProps {
  status: string;
  onProcessClick: () => void;
}

export function SellerOrderActions({ status, onProcessClick }: SellerOrderActionsProps) {
  return (
    <div className="bg-muted/50 rounded-lg p-4 border border-border/80 space-y-2">
      <div className="flex items-center gap-1.5 text-xs text-foreground font-bold uppercase tracking-wider">
        <ShieldCheck className="h-4 w-4 text-primary" />
        <span>Seller Actions</span>
      </div>
      {status === 'sedang_dikemas' ? (
        <>
          <p className="text-xs text-muted-foreground leading-relaxed">
            This order is ready to be prepared. Click below to pack and notify a driver for
            shipment.
          </p>
          <Button
            className="w-full mt-2 cursor-pointer font-bold bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-200"
            onClick={onProcessClick}
          >
            Process Order
          </Button>
        </>
      ) : status === 'menunggu_pengirim' ? (
        <>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Order processed. Waiting for a driver to accept the shipment job.
          </p>
          <Button className="w-full mt-2" disabled variant="secondary">
            Waiting for Driver
          </Button>
        </>
      ) : (
        <>
          <p className="text-xs text-muted-foreground leading-relaxed">
            No action needed. Order is currently in status:{' '}
            <strong className="text-foreground capitalize font-bold">
              {status.replace('_', ' ')}
            </strong>
            .
          </p>
        </>
      )}
    </div>
  );
}
