import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { useEffect } from 'react';
import { useAuth } from '@/lib/auth/context';
import { useQuery } from '@tanstack/react-query';
import { adminMonitoringEndpointOptions } from '@/lib/api/generated/@tanstack/react-query.gen';
import {
  Users,
  Store,
  Package,
  ShoppingCart,
  Ticket,
  Percent,
  Truck,
  AlertTriangle,
  Coins,
  ChevronRight,
} from 'lucide-react';
import { MonitoringCard } from './components/MonitoringCard';
import { Card } from '@/components/ui/card';

export const Route = createFileRoute('/dashboard/admin/')({
  component: AdminDashboardIndex,
});

function AdminDashboardIndex() {
  const auth = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!auth.isLoading && auth.activeRole !== 'admin') {
      navigate({ to: '/select-role' });
    }
  }, [auth.isLoading, auth.activeRole, navigate]);

  const {
    data: stats,
    isLoading,
    error,
  } = useQuery({
    ...adminMonitoringEndpointOptions(),
    enabled: auth.activeRole === 'admin',
  });

  if (auth.isLoading || auth.activeRole !== 'admin') {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <span className="animate-pulse text-muted-foreground text-sm font-medium">
          Checking authorization...
        </span>
      </div>
    );
  }

  const formatIdr = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-4 md:p-6">
      {/* Header section with quick summary */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 rounded-2xl border border-primary/10">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            Admin Control Center
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time monitoring and administrative tools for SEAPEDIA marketplace.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/dashboard/admin/discounts"
            className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/95 transition-all px-4 py-2.5 rounded-xl text-sm font-semibold shadow-sm"
          >
            Manage Discounts <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 animate-pulse">
          {[...Array(9)].map((_, i) => (
            <div key={i} className="h-32 bg-muted rounded-xl border border-border" />
          ))}
        </div>
      ) : error ? (
        <Card className="border-destructive/30 bg-destructive/5 text-destructive p-6 rounded-2xl">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6" />
            <div>
              <h3 className="font-semibold text-lg">Failed to Load Monitoring Data</h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                Please refresh the page or contact the technical support team.
              </p>
            </div>
          </div>
        </Card>
      ) : stats ? (
        <div className="space-y-6">
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            Marketplace Analytics
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <MonitoringCard
              title="Gross Merchandise Value (GMV)"
              value={formatIdr(stats.totalRevenue)}
              icon={<Coins className="h-4 w-4" />}
              description="Total completed orders revenue"
            />
            <MonitoringCard
              title="Total Users"
              value={stats.totalUsers}
              icon={<Users className="h-4 w-4" />}
              description="Registered buyers, sellers, and drivers"
            />
            <MonitoringCard
              title="Total Stores"
              value={stats.totalStores}
              icon={<Store className="h-4 w-4" />}
              description="Active merchant shops"
            />
            <MonitoringCard
              title="Active Products"
              value={stats.totalProducts}
              icon={<Package className="h-4 w-4" />}
              description="Listed items in public catalog"
            />
            <MonitoringCard
              title="Total Orders"
              value={stats.totalOrders}
              icon={<ShoppingCart className="h-4 w-4" />}
              description="Cumulative checkout orders"
            />
            <MonitoringCard
              title="Delivery Jobs"
              value={stats.totalDeliveryJobs}
              icon={<Truck className="h-4 w-4" />}
              description="Assigned/completed delivery tasks"
            />
            <MonitoringCard
              title="Total Vouchers"
              value={stats.totalVouchers}
              icon={<Ticket className="h-4 w-4" />}
              description="Admin-generated discount vouchers"
            />
            <MonitoringCard
              title="Total Promos"
              value={stats.totalPromos}
              icon={<Percent className="h-4 w-4" />}
              description="Active and expired promo campaigns"
            />
            <MonitoringCard
              title="Overdue Orders"
              value={stats.totalOverdueOrders}
              icon={<AlertTriangle className="h-4 w-4" />}
              description="Orders exceeding SLA times"
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
