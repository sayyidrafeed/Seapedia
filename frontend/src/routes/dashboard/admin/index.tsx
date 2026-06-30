import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import { useAuth } from '@/lib/auth/context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getDashboardStatsOptions } from '@/lib/api/generated/@tanstack/react-query.gen';
import { processOverdueOrders, simulateTime } from '@/lib/api/generated';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  Users,
  Store,
  ShoppingBag,
  ShoppingCart,
  Ticket,
  AlertTriangle,
  Truck,
  Loader2,
  Clock,
  RefreshCw,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, PieChart, Pie, Cell } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import type { ChartConfig } from '@/components/ui/chart';

export const Route = createFileRoute('/dashboard/admin/')({
  component: AdminDashboardIndex,
});

const ROLE_COLORS = {
  admin: '#10b981', // green-500
  buyer: '#3b82f6', // blue-500
  seller: '#f59e0b', // amber-500
  driver: '#8b5cf6', // purple-500
};

const ORDER_COLORS = {
  sedang_dikemas: '#f59e0b',
  menunggu_pengirim: '#6366f1',
  sedang_dikirim: '#3b82f6',
  pesanan_selesai: '#10b981',
  dikembalikan: '#ef4444',
};

const DELIVERY_COLORS = {
  pending: '#f59e0b',
  taken: '#3b82f6',
  completed: '#10b981',
};

const roleChartConfig = {
  admin: { label: 'Admin', color: ROLE_COLORS.admin },
  buyer: { label: 'Buyer', color: ROLE_COLORS.buyer },
  seller: { label: 'Seller', color: ROLE_COLORS.seller },
  driver: { label: 'Driver', color: ROLE_COLORS.driver },
} satisfies ChartConfig;

const orderChartConfig = {
  sedang_dikemas: { label: 'Sedang Dikemas', color: ORDER_COLORS.sedang_dikemas },
  menunggu_pengirim: { label: 'Menunggu Pengirim', color: ORDER_COLORS.menunggu_pengirim },
  sedang_dikirim: { label: 'Sedang Dikirim', color: ORDER_COLORS.sedang_dikirim },
  pesanan_selesai: { label: 'Pesanan Selesai', color: ORDER_COLORS.pesanan_selesai },
  dikembalikan: { label: 'Dikembalikan', color: ORDER_COLORS.dikembalikan },
} satisfies ChartConfig;

const deliveryChartConfig = {
  pending: { label: 'Pending', color: DELIVERY_COLORS.pending },
  taken: { label: 'Taken', color: DELIVERY_COLORS.taken },
  completed: { label: 'Completed', color: DELIVERY_COLORS.completed },
} satisfies ChartConfig;

function AdminDashboardIndex() {
  const auth = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!auth.isLoading && auth.activeRole !== 'admin') {
      navigate({ to: '/select-role' });
    }
  }, [auth.isLoading, auth.activeRole, navigate]);

  const queryClient = useQueryClient();

  const simulateMutation = useMutation({
    mutationFn: async (hours: number) => {
      const { data, error } = await simulateTime({
        body: { hoursToAdvance: hours },
      });
      if (error) throw new Error(error.error || 'Failed to simulate time');
      return data;
    },
    onSuccess: (data) => {
      toast.success(
        data.newOffsetHours === 0
          ? 'System time offset has been reset!'
          : `Simulated time forward by ${data.newOffsetHours} hours!`,
      );
      queryClient.invalidateQueries({ queryKey: getDashboardStatsOptions().queryKey });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const processOverdueMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await processOverdueOrders();
      if (error) throw new Error(error.error || 'Failed to process overdue orders');
      return data;
    },
    onSuccess: (data) => {
      if (data.processedCount > 0) {
        toast.success(`Successfully processed ${data.processedCount} overdue orders!`);
      } else {
        toast.info('No overdue orders found to process.');
      }
      queryClient.invalidateQueries({ queryKey: getDashboardStatsOptions().queryKey });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const {
    data: stats,
    isLoading,
    error,
  } = useQuery({
    ...getDashboardStatsOptions(),
    enabled: auth.activeRole === 'admin',
    refetchInterval: 30000, // Auto refresh every 30 seconds for real-time monitoring
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

  if (isLoading) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="text-muted-foreground text-sm font-medium">
          Loading dashboard metrics...
        </span>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center space-y-4 text-center">
        <AlertTriangle className="h-12 w-12 text-red-500" />
        <h3 className="text-lg font-bold text-foreground">Error Loading Dashboard</h3>
        <p className="text-muted-foreground max-w-xs text-sm">
          {error instanceof Error ? error.message : 'Failed to retrieve stats. Please try again.'}
        </p>
      </div>
    );
  }

  // Transform User Roles for Pie Chart
  const userRolesData = [
    { role: 'admin', value: stats.users.roles.admin, fill: 'var(--color-admin)' },
    { role: 'buyer', value: stats.users.roles.buyer, fill: 'var(--color-buyer)' },
    { role: 'seller', value: stats.users.roles.seller, fill: 'var(--color-seller)' },
    { role: 'driver', value: stats.users.roles.driver, fill: 'var(--color-driver)' },
  ].filter((item) => item.value > 0);

  // Transform Order Statuses for Bar Chart
  const orderStatusesData = [
    {
      name: 'Sedang Dikemas',
      status: 'sedang_dikemas',
      count: stats.orders.statuses.sedang_dikemas,
      fill: 'var(--color-sedang_dikemas)',
    },
    {
      name: 'Menunggu Pengirim',
      status: 'menunggu_pengirim',
      count: stats.orders.statuses.menunggu_pengirim,
      fill: 'var(--color-menunggu_pengirim)',
    },
    {
      name: 'Sedang Dikirim',
      status: 'sedang_dikirim',
      count: stats.orders.statuses.sedang_dikirim,
      fill: 'var(--color-sedang_dikirim)',
    },
    {
      name: 'Pesanan Selesai',
      status: 'pesanan_selesai',
      count: stats.orders.statuses.pesanan_selesai,
      fill: 'var(--color-pesanan_selesai)',
    },
    {
      name: 'Dikembalikan',
      status: 'dikembalikan',
      count: stats.orders.statuses.dikembalikan,
      fill: 'var(--color-dikembalikan)',
    },
  ];

  // Transform Delivery Job Statuses for Bar Chart
  const deliveryStatusesData = [
    {
      name: 'Pending',
      status: 'pending',
      count: stats.deliveries.statuses.pending,
      fill: 'var(--color-pending)',
    },
    {
      name: 'Taken',
      status: 'taken',
      count: stats.deliveries.statuses.taken,
      fill: 'var(--color-taken)',
    },
    {
      name: 'Completed',
      status: 'completed',
      count: stats.deliveries.statuses.completed,
      fill: 'var(--color-completed)',
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-muted-foreground text-sm">
            Comprehensive real-time monitoring of SEAPEDIA marketplace system.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => simulateMutation.mutate(24)}
            disabled={simulateMutation.isPending}
            variant="outline"
            className="flex items-center gap-2 rounded-xl font-bold cursor-pointer"
          >
            {simulateMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Clock className="h-4 w-4" />
            )}
            Simulate +1 Day
          </Button>
          <Button
            onClick={() => simulateMutation.mutate(0)}
            disabled={simulateMutation.isPending}
            variant="ghost"
            className="flex items-center gap-2 rounded-xl text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <RefreshCw className="h-4 w-4" />
            Reset Time
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Users */}
        <Card className="shadow-sm border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total Users
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.users.total}</div>
            <p className="text-[10px] text-muted-foreground mt-1">
              Active unique accounts in database
            </p>
          </CardContent>
        </Card>

        {/* Total Stores */}
        <Card className="shadow-sm border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total Stores
            </CardTitle>
            <Store className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.stores.total}</div>
            <p className="text-[10px] text-muted-foreground mt-1">Registered merchant stores</p>
          </CardContent>
        </Card>

        {/* Total Products */}
        <Card className="shadow-sm border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total Products
            </CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.products.total}</div>
            <p className="text-[10px] text-muted-foreground mt-1">Cataloged item SKUs</p>
          </CardContent>
        </Card>

        {/* Overdue Orders Alert */}
        <Card
          className={`shadow-sm border-border transition-colors duration-200 ${
            stats.overdueOrders.total > 0
              ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50'
              : ''
          }`}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle
              className={`text-xs font-semibold uppercase tracking-wider ${
                stats.overdueOrders.total > 0
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-muted-foreground'
              }`}
            >
              Overdue Orders
            </CardTitle>
            <AlertTriangle
              className={`h-4 w-4 ${
                stats.overdueOrders.total > 0
                  ? 'text-rose-500 animate-bounce'
                  : 'text-muted-foreground'
              }`}
            />
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div
                className={`text-2xl font-bold ${
                  stats.overdueOrders.total > 0
                    ? 'text-rose-600 dark:text-rose-400'
                    : 'text-foreground'
                }`}
              >
                {stats.overdueOrders.total}
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">
                Active orders past delivery SLA
              </p>
            </div>
            {stats.overdueOrders.total > 0 && (
              <Button
                variant="destructive"
                size="sm"
                className="w-full font-bold rounded-lg text-xs py-1.5 h-auto cursor-pointer"
                onClick={() => processOverdueMutation.mutate()}
                disabled={processOverdueMutation.isPending}
              >
                {processOverdueMutation.isPending ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                    Processing...
                  </>
                ) : (
                  'Process Overdue Orders'
                )}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Total Orders */}
        <Card className="shadow-sm border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total Orders
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.orders.total}</div>
          </CardContent>
        </Card>

        {/* Deliveries */}
        <Card className="shadow-sm border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Delivery Jobs
            </CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.deliveries.total}</div>
          </CardContent>
        </Card>

        {/* Discounts Summary */}
        <Card className="shadow-sm border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Active Promos & Vouchers
            </CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {stats.discounts.vouchers + stats.discounts.promos}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              {stats.discounts.vouchers} Vouchers · {stats.discounts.promos} Promos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Visualizations Section */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* User Role Distribution */}
        <Card className="col-span-1 shadow-sm border-border">
          <CardHeader>
            <CardTitle className="text-base font-bold text-foreground">User Roles</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Breakdown of registered accounts
            </CardDescription>
          </CardHeader>
          <CardContent>
            {userRolesData.length === 0 ? (
              <div className="flex h-[240px] items-center justify-center text-sm text-muted-foreground">
                No user data found
              </div>
            ) : (
              <div className="h-[240px] w-full flex flex-col justify-between">
                <ChartContainer config={roleChartConfig} className="h-[180px] w-full">
                  <PieChart>
                    <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                    <Pie
                      data={userRolesData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="value"
                      nameKey="role"
                    >
                      {userRolesData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                  </PieChart>
                </ChartContainer>
                {/* Custom Legend for control */}
                <div className="grid grid-cols-2 gap-2 text-xs font-medium px-4">
                  {userRolesData.map((entry, index) => {
                    const cfg = roleChartConfig[entry.role as keyof typeof roleChartConfig];
                    return (
                      <div key={`legend-${index}`} className="flex items-center space-x-2">
                        <div
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: cfg?.color }}
                        />
                        <span className="text-muted-foreground capitalize">
                          {cfg?.label || entry.role}:
                        </span>
                        <span className="text-foreground font-bold">{entry.value}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Order Lifecycle Distribution */}
        <Card className="col-span-1 lg:col-span-2 shadow-sm border-border">
          <CardHeader>
            <CardTitle className="text-base font-bold text-foreground">Order Lifecycle</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Order status distribution
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats.orders.total === 0 ? (
              <div className="flex h-[240px] items-center justify-center text-sm text-muted-foreground">
                No orders made yet
              </div>
            ) : (
              <div className="h-[240px] w-full">
                <ChartContainer config={orderChartConfig} className="h-full w-full">
                  <BarChart
                    data={orderStatusesData}
                    margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                  >
                    <XAxis
                      dataKey="name"
                      tickLine={false}
                      axisLine={false}
                      className="fill-muted-foreground text-[10px]"
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                      className="fill-muted-foreground text-[10px]"
                    />
                    <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {orderStatusesData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ChartContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Logistics / Delivery Statuses */}
        <Card className="col-span-1 md:col-span-2 lg:col-span-3 shadow-sm border-border">
          <CardHeader>
            <CardTitle className="text-base font-bold text-foreground">
              Logistics / Delivery Status
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Distribution of delivery jobs in the marketplace
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats.deliveries.total === 0 ? (
              <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
                No delivery jobs generated yet
              </div>
            ) : (
              <div className="h-[200px] w-full">
                <ChartContainer config={deliveryChartConfig} className="h-full w-full">
                  <BarChart
                    data={deliveryStatusesData}
                    margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                  >
                    <XAxis
                      dataKey="name"
                      tickLine={false}
                      axisLine={false}
                      className="fill-muted-foreground text-[10px]"
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                      className="fill-muted-foreground text-[10px]"
                    />
                    <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {deliveryStatusesData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ChartContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
