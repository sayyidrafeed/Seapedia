import { Button } from '@/components/ui/button';
import { MapPin, PlusCircle } from 'lucide-react';
import { AddressCard } from './address-card';
import type { AddressResponse } from '@/lib/api/generated';

interface AddressListProps {
  addresses: AddressResponse[] | undefined;
  onEdit: (address: AddressResponse) => void;
  onDelete: (id: string) => void;
  onSetDefault: (id: string) => void;
  onAddNew: () => void;
  isActionPending?: boolean;
}

export function AddressList({
  addresses,
  onEdit,
  onDelete,
  onSetDefault,
  onAddNew,
  isActionPending,
}: AddressListProps) {
  if (!addresses || addresses.length === 0) {
    return (
      <div className="border-2 border-dashed border-border rounded-xl p-12 text-center flex flex-col items-center justify-center space-y-4">
        <MapPin className="h-10 w-10 text-muted-foreground/50" />
        <div>
          <p className="font-semibold text-foreground">Belum ada alamat tersimpan</p>
          <p className="text-xs text-muted-foreground mt-1">
            Add shipping addresses so we can calculate shipping fees during checkout.
          </p>
        </div>
        <Button onClick={onAddNew} variant="outline" className="gap-1.5">
          <PlusCircle className="h-4 w-4" /> Add your first address
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {addresses.map((address) => (
        <AddressCard
          key={address.id}
          address={address}
          onEdit={onEdit}
          onDelete={onDelete}
          onSetDefault={onSetDefault}
          isActionPending={isActionPending}
        />
      ))}
    </div>
  );
}
