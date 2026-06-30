import { createFileRoute } from '@tanstack/react-router';
import { getCurrentSellerStoreOptions } from '@/lib/api/generated/@tanstack/react-query.gen';
import { useQuery } from '@tanstack/react-query';
import { StoreProfileForm } from '@/features/seller/components/store-profile-form';

export const Route = createFileRoute('/dashboard/seller/store')({
  component: SellerStoreManagement,
});

function SellerStoreManagement() {
  const { data: store, isLoading } = useQuery({
    ...getCurrentSellerStoreOptions(),
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <span className="animate-pulse text-muted-foreground text-sm font-medium">
          Loading store profile...
        </span>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg p-4">
        Store not found. Please complete onboarding first.
      </div>
    );
  }

  return <StoreProfileForm store={store} />;
}
