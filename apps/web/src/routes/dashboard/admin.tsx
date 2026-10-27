import { createFileRoute, Outlet } from '@tanstack/react-router';
import { useAuth } from '@/lib/auth/context';
import { DashboardLayout } from '@/components/shared/dashboard-layout';
import { LayoutDashboard, Ticket, MessageSquare } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { requireDashboardRole } from '@/lib/auth/guards';

export const Route = createFileRoute('/dashboard/admin')({
  beforeLoad: ({ context }) => {
    requireDashboardRole(context.auth, 'admin');
  },
  component: AdminLayout,
});

function AdminLayout() {
  const auth = useAuth();
  const { t } = useTranslation();

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
    {
      label: t('admin.layout.nav.reviews'),
      to: '/dashboard/admin/reviews',
      icon: <MessageSquare className="h-4 w-4" />,
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
