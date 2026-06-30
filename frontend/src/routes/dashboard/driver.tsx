import { createFileRoute, Outlet, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import { useAuth } from '@/lib/auth/context';
import { DashboardLayout } from '@/components/shared/dashboard-layout';
import { LayoutDashboard, Truck } from 'lucide-react';

export const Route = createFileRoute('/dashboard/driver')({
  component: DriverLayout,
});

function DriverLayout() {
  const auth = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!auth.isLoading && auth.activeRole !== 'driver') {
      navigate({ to: '/select-role' });
    }
  }, [auth.isLoading, auth.activeRole, navigate]);

  if (auth.isLoading || auth.activeRole !== 'driver') {
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
      label: 'Overview',
      to: '/dashboard/driver',
      icon: <LayoutDashboard className="h-4 w-4" />,
      exact: true,
    },
    {
      label: 'Available Jobs',
      to: '/dashboard/driver/jobs',
      icon: <Truck className="h-4 w-4" />,
    },
  ];

  return (
    <DashboardLayout
      title="Driver Dashboard"
      description="Manage your delivery jobs, track progress, and view earnings."
      navItems={navItems}
    >
      <Outlet />
    </DashboardLayout>
  );
}
