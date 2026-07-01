import { Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { OrderAddressCard } from '@/components/orders/order-address-card';
import { AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Address {
  id: string;
  recipientName: string;
  label: string;
  phoneNumber: string;
  fullAddress: string;
  district: string;
  city: string;
  province: string;
  postalCode: string;
}

interface CheckoutShippingSectionProps {
  defaultAddress: Address | undefined;
}

export function CheckoutShippingSection({ defaultAddress }: CheckoutShippingSectionProps) {
  const { t } = useTranslation();

  if (!defaultAddress) {
    return (
      <div className="border border-border/80 bg-card rounded-xl p-8 flex flex-col items-center justify-center py-6 text-center text-muted-foreground space-y-3">
        <AlertCircle className="h-10 w-10 text-destructive animate-pulse" />
        <p className="text-sm font-medium">{t('buyer.checkout.noDefaultAddress')}</p>
        <p className="text-xs max-w-sm">{t('buyer.checkout.noDefaultAddressDesc')}</p>
        <Link to="/dashboard/buyer/addresses">
          <Button size="sm" className="cursor-pointer">
            {t('buyer.checkout.addShippingAddress')}
          </Button>
        </Link>
      </div>
    );
  }

  const changeAddressLink = (
    <Link to="/dashboard/buyer/addresses">
      <Button
        variant="link"
        size="sm"
        className="text-primary hover:underline h-auto p-0 cursor-pointer"
      >
        {t('buyer.checkout.changeAddress')}
      </Button>
    </Link>
  );

  return (
    <OrderAddressCard
      address={defaultAddress}
      title={t('buyer.checkout.shippingAddress')}
      action={changeAddressLink}
      className="hover:border-primary/20 transition duration-200"
    />
  );
}
