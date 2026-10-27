import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Navigation, Calendar, Package } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

interface Address {
  recipientName: string;
  phoneNumber: string;
  fullAddress: string;
  district: string;
  city: string;
  province: string;
  postalCode: string;
  label: string;
}

interface Item {
  id: string;
  productName: string;
  productPrice: number;
  quantity: number;
}

export function PickupCard({ storeName }: { storeName: string }) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          {t('driver.jobs.pickupTitle')}
        </CardTitle>
        <CardDescription>{t('driver.jobs.pickupDesc')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="font-semibold text-lg">{storeName}</div>
        <p className="text-sm text-muted-foreground">{t('driver.jobs.pickupSubtext')}</p>
      </CardContent>
    </Card>
  );
}

export function DropoffCard({ address }: { address: Address }) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <Navigation className="h-5 w-5 text-primary" />
          {t('driver.jobs.dropoffTitle')}
        </CardTitle>
        <CardDescription>{t('driver.jobs.dropoffDesc')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="font-semibold text-base">
            {address.recipientName} ({address.label})
          </div>
          <div className="text-sm text-muted-foreground mt-0.5">
            {t('driver.jobs.phone')}
            {address.phoneNumber}
          </div>
        </div>
        <div className="p-3 bg-muted rounded-md text-sm leading-relaxed">
          {address.fullAddress}, {address.district}, {address.city}, {address.province},{' '}
          {address.postalCode}
        </div>
      </CardContent>
    </Card>
  );
}

export function PackageContentsCard({ items }: { items?: Item[] }) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <Package className="h-5 w-5 text-primary" />
          {t('driver.jobs.contentsTitle')}
        </CardTitle>
        <CardDescription>{t('driver.jobs.contentsDesc')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 divide-y divide-border/60">
        {!items || items.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('driver.jobs.noDetails')}</p>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="pt-3 first:pt-0 flex justify-between items-center text-sm"
            >
              <div>
                <div className="font-semibold text-foreground">{item.productName}</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {formatCurrency(item.productPrice)} × {item.quantity}
                </div>
              </div>
              <span className="font-bold text-foreground">
                {formatCurrency(item.productPrice * item.quantity)}
              </span>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

export function OrderSummaryCard({
  orderId,
  deliveryMethod,
  totalAmount,
  createdAt,
}: {
  orderId: string;
  deliveryMethod: string;
  totalAmount: number;
  createdAt: string;
}) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-bold flex items-center gap-2">
          <Package className="h-5 w-5 text-muted-foreground" />
          {t('driver.jobs.orderSummary')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">{t('driver.jobs.orderIdLabel')}</span>
          <span className="font-mono text-xs">{orderId.slice(0, 8)}...</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">{t('driver.jobs.methodLabel')}</span>
          <span className="font-medium capitalize">{deliveryMethod}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">{t('driver.jobs.totalAmountLabel')}</span>
          <span className="font-semibold">{formatCurrency(totalAmount)}</span>
        </div>
        <div className="flex justify-between items-center pt-2 border-t border-border">
          <span className="text-muted-foreground flex items-center gap-1">
            <Calendar className="h-4 w-4" /> {t('driver.jobs.createdLabel')}
          </span>
          <span className="text-xs">{new Date(createdAt).toLocaleString()}</span>
        </div>
      </CardContent>
    </Card>
  );
}
