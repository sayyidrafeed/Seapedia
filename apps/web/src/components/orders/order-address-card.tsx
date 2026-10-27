import { Card, CardContent } from '@/components/ui/card';
import { MapPin } from 'lucide-react';

interface AddressSnapshot {
  recipientName: string;
  label: string;
  phoneNumber: string;
  fullAddress: string;
  district: string;
  city: string;
  province: string;
  postalCode: string;
}

interface OrderAddressCardProps {
  address: AddressSnapshot;
  title?: string;
  action?: React.ReactNode;
  className?: string;
}

export function OrderAddressCard({
  address,
  title = 'Shipping Destination',
  action,
  className,
}: OrderAddressCardProps) {
  return (
    <Card className={`border border-border/80 shadow-sm overflow-hidden ${className || ''}`}>
      <div className="bg-muted/50 p-4 border-b border-border/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">{title}</h3>
        </div>
        {action}
      </div>
      <CardContent className="p-6 space-y-2">
        <div className="flex items-center gap-2">
          <span className="font-bold text-foreground text-base">{address.recipientName}</span>
          <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full font-semibold">
            {address.label}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">{address.phoneNumber}</p>
        <p className="text-sm text-foreground leading-relaxed">
          {address.fullAddress}, {address.district}, {address.city}, {address.province} -{' '}
          {address.postalCode}
        </p>
      </CardContent>
    </Card>
  );
}
