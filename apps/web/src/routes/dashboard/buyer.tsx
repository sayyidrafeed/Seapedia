import { createFileRoute, Outlet } from '@tanstack/react-router';
import { useAuth } from '@/lib/auth/context';
import { DashboardLayout } from '@/components/shared/dashboard-layout';
import { LayoutDashboard, Wallet, MapPin, Package, BarChart3 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { requireDashboardRole } from '@/lib/auth/guards';

export const Route = createFileRoute('/dashboard/buyer')({
  beforeLoad: ({ context }) => {
    requireDashboardRole(context.auth, 'buyer');
  },
  component: BuyerLayout,
});

function BuyerLayout() {
  const auth = useAuth();
  const { t } = useTranslation();

  if (auth.isLoading || auth.activeRole !== 'buyer') {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <span className="animate-pulse text-muted-foreground text-sm font-medium">
          {t('buyer.checkingAuth')}
        </span>
      </div>
    );
  }

  const navItems = [
    {
      label: t('buyer.portal.nav.overview'),
      to: '/dashboard/buyer',
      icon: <LayoutDashboard className="h-4 w-4" />,
      exact: true,
    },
    {
      label: t('buyer.portal.nav.wallet'),
      to: '/dashboard/buyer/wallet',
      icon: <Wallet className="h-4 w-4" />,
    },
    {
      label: t('buyer.portal.nav.addresses'),
      to: '/dashboard/buyer/addresses',
      icon: <MapPin className="h-4 w-4" />,
    },
    {
      label: t('buyer.portal.nav.orders'),
      to: '/dashboard/buyer/orders',
      icon: <Package className="h-4 w-4" />,
    },
    {
      label: t('buyer.portal.nav.report'),
      to: '/dashboard/buyer/report',
      icon: <BarChart3 className="h-4 w-4" />,
    },
  ];

  return (
    <DashboardLayout
      title={t('buyer.portal.title')}
      description={t('buyer.portal.description')}
      navItems={navItems}
    >
      <Outlet />
    </DashboardLayout>
  );
}
