import { createFileRoute, Outlet, useNavigate, useLocation } from '@tanstack/react-router';
import { useEffect } from 'react';
import { useAuth } from '@/lib/auth/context';
import { useQuery } from '@tanstack/react-query';
import { getCurrentSellerStoreOptions } from '@/lib/api/generated/@tanstack/react-query.gen';

export const Route = createFileRoute('/dashboard/seller')({
  component: SellerLayout,
});

function SellerLayout() {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const {
    data: store,
    isLoading: isStoreLoading,
    error: storeError,
  } = useQuery({
    ...getCurrentSellerStoreOptions(),
    retry: false,
    enabled: auth.activeRole === 'seller',
  });

  useEffect(() => {
    if (!auth.isLoading && auth.activeRole !== 'seller') {
      navigate({ to: '/select-role' });
    }
  }, [auth.isLoading, auth.activeRole, navigate]);

  useEffect(() => {
    if (auth.activeRole === 'seller' && !isStoreLoading) {
      const err = storeError as {
        message?: string;
        status?: number;
        error?: string;
        body?: { error?: string };
      } | null;
      const isNotFoundError =
        err &&
        (err.message?.includes('404') ||
          err.status === 404 ||
          err.error === 'Store not found' ||
          err.error?.includes('not found') ||
          err.body?.error === 'Store not found');

      if (isNotFoundError) {
        // No store found, redirect to onboarding if not already there
        if (location.pathname !== '/dashboard/seller/onboarding') {
          navigate({ to: '/dashboard/seller/onboarding' });
        }
      } else if (store && location.pathname === '/dashboard/seller/onboarding') {
        // Store exists, redirect away from onboarding
        navigate({ to: '/dashboard/seller' });
      }
    }
  }, [auth.activeRole, isStoreLoading, storeError, store, navigate, location.pathname]);

  if (auth.isLoading || auth.activeRole !== 'seller' || isStoreLoading) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <span className="animate-pulse text-muted-foreground text-sm font-medium">
          Loading seller workspace...
        </span>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-12 space-y-6">
      <div className="border-b border-border pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight capitalize">
            {store ? store.name : 'Seller Onboarding'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {store ? 'Seller Dashboard' : 'Complete your store profile to start selling.'}
          </p>
        </div>
        {store && (
          <div className="space-x-4">
            <button
              onClick={() => navigate({ to: '/dashboard/seller' })}
              className="text-sm font-medium hover:underline text-primary cursor-pointer border-none bg-transparent"
            >
              Dashboard
            </button>
            <button
              onClick={() => navigate({ to: '/dashboard/seller/products' })}
              className="text-sm font-medium hover:underline text-primary cursor-pointer border-none bg-transparent"
            >
              Products
            </button>
            <button
              onClick={() => navigate({ to: '/dashboard/seller/orders' })}
              className="text-sm font-medium hover:underline text-primary cursor-pointer border-none bg-transparent"
            >
              Incoming Orders
            </button>
            <button
              onClick={() => navigate({ to: '/dashboard/seller/report' })}
              className="text-sm font-medium hover:underline text-primary cursor-pointer border-none bg-transparent"
            >
              Income Report
            </button>
            <button
              onClick={() => navigate({ to: '/dashboard/seller/store' })}
              className="text-sm font-medium hover:underline text-primary cursor-pointer border-none bg-transparent"
            >
              Store Profile
            </button>
            <button
              onClick={() => navigate({ to: `/${store.slug}` })}
              className="text-sm font-medium hover:underline text-muted-foreground cursor-pointer border-none bg-transparent"
            >
              View Public Store
            </button>
          </div>
        )}
      </div>

      <Outlet />
    </div>
  );
}
