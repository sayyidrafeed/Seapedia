import { createFileRoute } from '@tanstack/react-router';
import { getCurrentSellerStoreOptions } from '@/lib/api/generated/@tanstack/react-query.gen';
import { useQuery } from '@tanstack/react-query';
import { StoreProfileForm } from '@/features/seller/components/store-profile-form';
import { useTranslation } from 'react-i18next';

export const Route = createFileRoute('/dashboard/seller/store')({
  component: SellerStoreManagement,
});

function SellerStoreManagement() {
  const { t } = useTranslation();
  const { data: store, isLoading } = useQuery({
    ...getCurrentSellerStoreOptions(),
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <span className="animate-pulse text-muted-foreground text-sm font-medium">
          {t('seller.store.loading')}
        </span>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg p-4">
        {t('seller.store.notFound')}
      </div>
    );
  }

  return <StoreProfileForm store={store} />;
}
