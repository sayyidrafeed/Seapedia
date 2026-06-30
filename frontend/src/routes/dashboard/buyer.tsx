import { createFileRoute, Outlet, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import { useAuth } from '@/lib/auth/context';
import { DashboardLayout } from '@/components/shared/dashboard-layout';
import { LayoutDashboard, Wallet, MapPin, Package, BarChart3 } from 'lucide-react';

export const Route = createFileRoute('/dashboard/buyer')({
  component: BuyerLayout,
});

function BuyerLayout() {
  const auth = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!auth.isLoading && auth.activeRole !== 'buyer') {
      navigate({ to: '/select-role' });
    }
  }, [auth.isLoading, auth.activeRole, navigate]);

  if (auth.isLoading || auth.activeRole !== 'buyer') {
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
      to: '/dashboard/buyer',
      icon: <LayoutDashboard className="h-4 w-4" />,
      exact: true,
    },
    {
      label: 'Wallet & Top-up',
      to: '/dashboard/buyer/wallet',
      icon: <Wallet className="h-4 w-4" />,
    },
    {
      label: 'Manage Addresses',
      to: '/dashboard/buyer/addresses',
      icon: <MapPin className="h-4 w-4" />,
    },
    {
      label: 'My Orders',
      to: '/dashboard/buyer/orders',
      icon: <Package className="h-4 w-4" />,
    },
    {
      label: 'Spending Report',
      to: '/dashboard/buyer/report',
      icon: <BarChart3 className="h-4 w-4" />,
    },
  ];

  return (
    <DashboardLayout
      title="Buyer Portal"
      description="Manage your wallet, delivery addresses, and orders."
      navItems={navItems}
    >
      <Outlet />
    </DashboardLayout>
  );
}
