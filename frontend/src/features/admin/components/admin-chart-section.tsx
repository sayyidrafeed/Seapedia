import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, PieChart, Pie, Cell } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { roleChartConfig, orderChartConfig, deliveryChartConfig } from '../constants/chart-configs';
import { useTranslation } from 'react-i18next';

interface DashboardStats {
  users: {
    total: number;
    roles: { admin: number; buyer: number; seller: number; driver: number };
  };
  orders: {
    total: number;
    statuses: {
      sedang_dikemas: number;
      menunggu_pengirim: number;
      sedang_dikirim: number;
      pesanan_selesai: number;
      dikembalikan: number;
    };
  };
  deliveries: {
    total: number;
    statuses: { pending: number; taken: number; completed: number };
  };
}

interface AdminChartSectionProps {
  stats: DashboardStats;
}

export function AdminChartSection({ stats }: AdminChartSectionProps) {
  const { t } = useTranslation();

  // Transform User Roles for Pie Chart
  const userRolesData = [
    { role: 'admin', value: stats.users.roles.admin, fill: 'var(--color-admin)' },
    { role: 'buyer', value: stats.users.roles.buyer, fill: 'var(--color-buyer)' },
    { role: 'seller', value: stats.users.roles.seller, fill: 'var(--color-accent)' },
    { role: 'driver', value: stats.users.roles.driver, fill: 'var(--color-driver)' },
  ].filter((item) => item.value > 0);

  // Transform Order Statuses for Bar Chart
  const orderStatusesData = [
    {
      name: t('orderStatus.sedang_dikemas'),
      status: 'sedang_dikemas',
      count: stats.orders.statuses.sedang_dikemas,
      fill: 'var(--color-sedang_dikemas)',
    },
    {
      name: t('orderStatus.menunggu_pengirim'),
      status: 'menunggu_pengirim',
      count: stats.orders.statuses.menunggu_pengirim,
      fill: 'var(--color-menunggu_pengirim)',
    },
    {
      name: t('orderStatus.sedang_dikirim'),
      status: 'sedang_dikirim',
      count: stats.orders.statuses.sedang_dikirim,
      fill: 'var(--color-sedang_dikirim)',
    },
    {
      name: t('orderStatus.pesanan_selesai'),
      status: 'pesanan_selesai',
      count: stats.orders.statuses.pesanan_selesai,
      fill: 'var(--color-pesanan_selesai)',
    },
    {
      name: t('orderStatus.dikembalikan'),
      status: 'dikembalikan',
      count: stats.orders.statuses.dikembalikan,
      fill: 'var(--color-dikembalikan)',
    },
  ];

  // Transform Delivery Job Statuses for Bar Chart
  const deliveryStatusesData = [
    {
      name: t('deliveryStatus.pending'),
      status: 'pending',
      count: stats.deliveries.statuses.pending,
      fill: 'var(--color-pending)',
    },
    {
      name: t('deliveryStatus.taken'),
      status: 'taken',
      count: stats.deliveries.statuses.taken,
      fill: 'var(--color-taken)',
    },
    {
      name: t('deliveryStatus.completed'),
      status: 'completed',
      count: stats.deliveries.statuses.completed,
      fill: 'var(--color-completed)',
    },
  ];

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {/* User Role Distribution */}
      <Card className="col-span-1 shadow-sm border-border">
        <CardHeader>
          <CardTitle className="text-base font-bold text-foreground">
            {t('admin.charts.userRolesTitle')}
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            {t('admin.charts.userRolesDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {userRolesData.length === 0 ? (
            <div className="flex h-[240px] items-center justify-center text-sm text-muted-foreground">
              {t('admin.charts.noUserData')}
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
          <CardTitle className="text-base font-bold text-foreground">
            {t('admin.charts.orderLifecycleTitle')}
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            {t('admin.charts.orderLifecycleDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stats.orders.total === 0 ? (
            <div className="flex h-[240px] items-center justify-center text-sm text-muted-foreground">
              {t('admin.charts.noOrders')}
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
            {t('admin.charts.logisticsTitle')}
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            {t('admin.charts.logisticsDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stats.deliveries.total === 0 ? (
            <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
              {t('admin.charts.noDeliveries')}
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
  );
}
