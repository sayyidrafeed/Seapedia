import { createFileRoute, Outlet, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import { useAuth } from '@/lib/auth/context';
import { DashboardLayout } from '@/components/shared/dashboard-layout';
import { LayoutDashboard, Ticket } from 'lucide-react';

export const Route = createFileRoute('/dashboard/admin')({
  component: AdminLayout,
});

function AdminLayout() {
  const auth = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!auth.isLoading && auth.activeRole !== 'admin') {
      navigate({ to: '/select-role' });
    }
  }, [auth.isLoading, auth.activeRole, navigate]);

  if (auth.isLoading || auth.activeRole !== 'admin') {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <span className="animate-pulse text-muted-foreground text-sm font-medium">
          Checking authorization...
        </span>
      </div>
    );
  }

  const navItems = [
    {
      label: 'Dashboard',
      to: '/dashboard/admin',
      icon: <LayoutDashboard className="h-4 w-4" />,
      exact: true,
    },
    {
      label: 'Discounts Management',
      to: '/dashboard/admin/discounts',
      icon: <Ticket className="h-4 w-4" />,
    },
  ];

  return (
    <DashboardLayout
      title="Admin Portal"
      description="System configuration, promotions, and marketplace monitoring."
      navItems={navItems}
    >
      <Outlet />
    </DashboardLayout>
  );
}
