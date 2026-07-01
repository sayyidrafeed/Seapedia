import { createFileRoute, Outlet, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import { useAuth } from '@/lib/auth/context';
import { DashboardLayout } from '@/components/shared/dashboard-layout';
import { LayoutDashboard, Ticket } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const Route = createFileRoute('/dashboard/admin')({
  component: AdminLayout,
});

function AdminLayout() {
  const auth = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    if (!auth.isLoading && auth.activeRole !== 'admin') {
      navigate({ to: '/select-role' });
    }
  }, [auth.isLoading, auth.activeRole, navigate]);

  if (auth.isLoading || auth.activeRole !== 'admin') {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <span className="animate-pulse text-muted-foreground text-sm font-medium">
          {t('admin.layout.checkingAuth')}
        </span>
      </div>
    );
  }

  const navItems = [
    {
      label: t('admin.layout.nav.dashboard'),
      to: '/dashboard/admin',
      icon: <LayoutDashboard className="h-4 w-4" />,
      exact: true,
    },
    {
      label: t('admin.layout.nav.discounts'),
      to: '/dashboard/admin/discounts',
      icon: <Ticket className="h-4 w-4" />,
    },
  ];

  return (
    <DashboardLayout
      title={t('admin.layout.title')}
      description={t('admin.layout.desc')}
      navItems={navItems}
    >
      <Outlet />
    </DashboardLayout>
  );
}
