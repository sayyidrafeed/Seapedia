import { createFileRoute, Outlet, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import { useAuth } from '@/lib/auth/context';
import { DashboardLayout } from '@/components/shared/dashboard-layout';
import { LayoutDashboard, Truck } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const Route = createFileRoute('/dashboard/driver')({
  component: DriverLayout,
});

function DriverLayout() {
  const auth = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    if (!auth.isLoading && auth.activeRole !== 'driver') {
      navigate({ to: '/select-role' });
    }
  }, [auth.isLoading, auth.activeRole, navigate]);

  if (auth.isLoading || auth.activeRole !== 'driver') {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <span className="animate-pulse text-muted-foreground text-sm font-medium">
          {t('driver.layout.checkingAuth')}
        </span>
      </div>
    );
  }

  const navItems = [
    {
      label: t('driver.layout.nav.overview'),
      to: '/dashboard/driver',
      icon: <LayoutDashboard className="h-4 w-4" />,
      exact: true,
    },
    {
      label: t('driver.layout.nav.jobs'),
      to: '/dashboard/driver/jobs',
      icon: <Truck className="h-4 w-4" />,
    },
  ];

  return (
    <DashboardLayout
      title={t('driver.layout.title')}
      description={t('driver.layout.desc')}
      navItems={navItems}
    >
      <Outlet />
    </DashboardLayout>
  );
}
