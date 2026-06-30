import { Link } from '@tanstack/react-router';
import { MapPin, ArrowRight, Plus } from 'lucide-react';

interface Address {
  id: string;
  recipientName: string;
  label: string;
  fullAddress: string;
  district: string;
  city: string;
  province: string;
  postalCode: string;
}

interface BuyerAddressCardProps {
  defaultAddress: Address | undefined;
  totalAddressesCount: number;
  isLoading: boolean;
}

export function BuyerAddressCard({
  defaultAddress,
  totalAddressesCount,
  isLoading,
}: BuyerAddressCardProps) {
  return (
    <div className="bg-card border border-border p-6 rounded-xl shadow-sm flex flex-col justify-between group hover:border-purple-500/20 transition-all duration-300">
      <div className="flex items-start justify-between">
        <div className="space-y-1 w-full max-w-[80%]">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Default Address
          </span>
          {isLoading ? (
            <div className="space-y-2 mt-2">
              <span className="h-4 w-24 bg-muted animate-pulse block rounded" />
              <span className="h-4 w-full bg-muted animate-pulse block rounded" />
            </div>
          ) : defaultAddress ? (
            <div className="mt-1">
              <div className="font-bold text-foreground text-sm flex items-center gap-1.5">
                {defaultAddress.recipientName}
                <span className="text-[10px] px-1.5 py-0.5 bg-purple-500/10 text-purple-600 rounded font-medium">
                  {defaultAddress.label}
                </span>
              </div>
              <p className="text-xs text-muted-foreground truncate mt-1">
                {defaultAddress.fullAddress}, {defaultAddress.district}, {defaultAddress.city},{' '}
                {defaultAddress.province} - {defaultAddress.postalCode}
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground mt-2">
              No default delivery address set yet.
            </p>
          )}
        </div>
        <div className="p-3 bg-purple-500/10 text-purple-500 rounded-xl">
          <MapPin className="h-6 w-6" />
        </div>
      </div>
      <div className="mt-8 border-t border-border/50 pt-4 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{totalAddressesCount} saved addresses</span>
        {totalAddressesCount > 0 ? (
          <Link
            to="/dashboard/buyer/addresses"
            className="text-sm font-semibold text-purple-500 hover:text-purple-600 flex items-center gap-1 group-hover:gap-2 transition-all"
          >
            Manage Addresses <ArrowRight className="h-4 w-4" />
          </Link>
        ) : (
          <Link
            to="/dashboard/buyer/addresses"
            className="text-sm font-semibold text-purple-500 hover:text-purple-600 flex items-center gap-1 group"
          >
            Add Address <Plus className="h-4 w-4" />
          </Link>
        )}
      </div>
    </div>
  );
}
