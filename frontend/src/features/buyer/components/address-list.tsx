import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { AddressCard } from './address-card';
import type { AddressResponse } from '@/lib/api/generated';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();

  if (!addresses || addresses.length === 0) {
    return (
      <div className="border-2 border-dashed border-border rounded-xl p-16 text-center flex flex-col items-center justify-center">
        <img
          src="/no-addresses.png"
          alt="No addresses"
          className="w-full max-w-[280px] sm:max-w-[320px] mb-6 object-contain opacity-90 hover:opacity-100 transition-opacity"
        />
        <div className="mb-6">
          <p className="font-semibold text-foreground">{t('buyer.address.noAddresses')}</p>
          <p className="text-xs text-muted-foreground mt-1">{t('buyer.address.noAddressesDesc')}</p>
        </div>
        <Button onClick={onAddNew} variant="outline" className="gap-1.5 cursor-pointer">
          <PlusCircle className="h-4 w-4" /> {t('buyer.address.addFirst')}
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
