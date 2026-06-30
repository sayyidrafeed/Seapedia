import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Home, Briefcase, MapPin, Edit, Trash2, CheckCircle2 } from 'lucide-react';
import type { AddressResponse } from '@/lib/api/generated';
import { useTranslation } from 'react-i18next';

interface AddressCardProps {
  address: AddressResponse;
  onEdit: (address: AddressResponse) => void;
  onDelete: (id: string) => void;
  onSetDefault: (id: string) => void;
  isActionPending?: boolean;
}

export function AddressCard({
  address,
  onEdit,
  onDelete,
  onSetDefault,
  isActionPending,
}: AddressCardProps) {
  const { t } = useTranslation();
  const isHome = address.label.toLowerCase() === 'rumah';
  const isWork = address.label.toLowerCase() === 'kantor';

  return (
    <Card
      className={`border relative transition-all duration-300 ${
        address.isDefault
          ? 'border-blue-500 shadow-sm bg-blue-500/[0.01]'
          : 'border-border hover:border-slate-300'
      }`}
    >
      {address.isDefault && (
        <div className="absolute top-4 right-4 bg-blue-500/10 text-blue-600 text-[10px] font-bold py-1 px-2.5 rounded-full flex items-center gap-1">
          <CheckCircle2 className="h-3 w-3" /> {t('buyer.address.primaryLabel')}
        </div>
      )}

      <CardHeader className="pb-3 pr-20">
        <CardTitle className="text-sm font-extrabold text-muted-foreground uppercase flex items-center gap-1.5">
          {isHome ? (
            <Home className="h-3.5 w-3.5 text-blue-500" />
          ) : isWork ? (
            <Briefcase className="h-3.5 w-3.5 text-purple-500" />
          ) : (
            <MapPin className="h-3.5 w-3.5 text-slate-500" />
          )}
          {address.label}
        </CardTitle>
        <div className="text-lg font-bold text-foreground mt-2">{address.recipientName}</div>
        <p className="text-xs text-muted-foreground font-semibold">{address.phoneNumber}</p>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-sm text-foreground leading-relaxed">
          {address.fullAddress}
          <span className="block text-xs text-muted-foreground mt-1">
            {t('buyer.address.kec')} {address.district}, {address.city}, {t('buyer.address.prov')}{' '}
            {address.province} - {address.postalCode}
          </span>
        </p>

        <div className="flex items-center gap-3 pt-3 border-t border-border/50 text-xs">
          {!address.isDefault && (
            <button
              onClick={() => onSetDefault(address.id)}
              className="font-bold text-blue-500 hover:text-blue-600 mr-auto disabled:opacity-50"
              disabled={isActionPending}
            >
              {t('buyer.address.makeDefaultButton')}
            </button>
          )}

          <button
            onClick={() => onEdit(address)}
            className={`flex items-center gap-1 text-muted-foreground hover:text-foreground font-bold ${
              address.isDefault ? 'mr-auto' : ''
            }`}
          >
            <Edit className="h-3.5 w-3.5" /> {t('buyer.address.editAddressButton')}
          </button>

          <button
            onClick={() => onDelete(address.id)}
            className="flex items-center gap-1 text-red-500 hover:text-red-600 font-bold disabled:opacity-50"
            disabled={isActionPending}
          >
            <Trash2 className="h-3.5 w-3.5" /> {t('buyer.address.deleteAddressButton')}
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
