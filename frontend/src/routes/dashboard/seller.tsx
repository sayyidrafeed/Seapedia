import { createFileRoute, Outlet, useNavigate, useLocation } from '@tanstack/react-router';
import { useEffect } from 'react';
import { useAuth } from '@/lib/auth/context';
import { useQuery } from '@tanstack/react-query';
import { getCurrentSellerStoreOptions } from '@/lib/api/generated/@tanstack/react-query.gen';
import { DashboardLayout } from '@/components/shared/dashboard-layout';
import { LayoutDashboard, ShoppingBag, Clock, BarChart3, User, ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const Route = createFileRoute('/dashboard/seller')({
  component: SellerLayout,
});

function SellerLayout() {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

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
        if (location.pathname !== '/dashboard/seller/onboarding') {
          navigate({ to: '/dashboard/seller/onboarding' });
        }
      } else if (store && location.pathname === '/dashboard/seller/onboarding') {
        navigate({ to: '/dashboard/seller' });
      }
    }
  }, [auth.activeRole, isStoreLoading, storeError, store, navigate, location.pathname]);

  if (auth.isLoading || auth.activeRole !== 'seller' || isStoreLoading) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <span className="animate-pulse text-muted-foreground text-sm font-medium">
          {t('seller.layout.loading')}
        </span>
      </div>
    );
  }

  const navItems = [
    {
      label: t('seller.layout.nav.overview'),
      to: '/dashboard/seller',
      icon: <LayoutDashboard className="h-4 w-4" />,
      exact: true,
    },
    {
      label: t('seller.layout.nav.products'),
      to: '/dashboard/seller/products',
      icon: <ShoppingBag className="h-4 w-4" />,
    },
    {
      label: t('seller.layout.nav.orders'),
      to: '/dashboard/seller/orders',
      icon: <Clock className="h-4 w-4" />,
    },
    {
      label: t('seller.layout.nav.report'),
      to: '/dashboard/seller/report',
      icon: <BarChart3 className="h-4 w-4" />,
    },
    {
      label: t('seller.layout.nav.store'),
      to: '/dashboard/seller/store',
      icon: <User className="h-4 w-4" />,
    },
  ];

  const extraHeaderContent = store ? (
    <button
      onClick={() => navigate({ to: `/${store.slug}` })}
      className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer border-none bg-transparent"
    >
      <span>{t('seller.layout.viewPublicStore')}</span>
      <ExternalLink className="h-3 w-3" />
    </button>
  ) : null;

  return (
    <DashboardLayout
      title={store ? store.name : t('seller.layout.onboardingTitle')}
      description={store ? t('seller.layout.dashboardDesc') : t('seller.layout.onboardingDesc')}
      navItems={store ? navItems : []}
      extraHeaderContent={extraHeaderContent}
    >
      <Outlet />
    </DashboardLayout>
  );
}
