import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth/context';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { adminMonitoringEndpointOptions } from '@/lib/api/generated/@tanstack/react-query.gen';
import { client } from '@/lib/api/generated/client.gen';
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
  Clock,
  RotateCcw,
  Loader2,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { MonitoringCard } from './components/MonitoringCard';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export const Route = createFileRoute('/dashboard/admin/')({
  component: AdminDashboardIndex,
});

function AdminDashboardIndex() {
  const auth = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [simulating, setSimulating] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [processResult, setProcessResult] = useState<{
    processedCount: number;
    details: Array<{ orderId: string; status: string; refundAmount: number; stockRestored: boolean }>;
  } | null>(null);

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

  const handleSimulateDay = async () => {
    setSimulating(true);
    setProcessResult(null);
    try {
      const { data, error: apiError } = await client.post({
        url: '/api/admin/simulate-day',
      });
      if (apiError) {
        throw new Error(typeof apiError === 'string' ? apiError : (apiError as any).error || 'Simulation failed');
      }
      toast.success(`Day advanced! Offset is now +${(data as any).dayOffset}`);
      queryClient.invalidateQueries({ queryKey: adminMonitoringEndpointOptions().queryKey });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to simulate day');
    } finally {
      setSimulating(false);
    }
  };

  const handleProcessOverdue = async () => {
    setProcessing(true);
    setProcessResult(null);
    try {
      const { data, error: apiError } = await client.post({
        url: '/api/admin/overdue/process',
      });
      if (apiError) {
        throw new Error(typeof apiError === 'string' ? apiError : (apiError as any).error || 'Processing failed');
      }
      const result = data as any;
      setProcessResult(result);
      toast.success(`Processed ${result.processedCount} overdue order(s)`);
      queryClient.invalidateQueries({ queryKey: adminMonitoringEndpointOptions().queryKey });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to process overdue orders');
    } finally {
      setProcessing(false);
    }
  };

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

          {/* Simulation & Overdue Controls */}
          <div className="space-y-4 pt-4">
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              Time Simulation & Overdue Management
            </h2>
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="border border-border p-6 rounded-2xl">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 flex items-center justify-center rounded-full bg-amber-100 text-amber-700 shrink-0">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div className="space-y-3 flex-1">
                    <div>
                      <h3 className="font-bold text-foreground">Simulate Next Day</h3>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        Advance the simulation clock by one day. All SLA calculations will use the
                        simulated time instead of real time.
                      </p>
                    </div>
                    <button
                      onClick={handleSimulateDay}
                      disabled={simulating}
                      className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer border-none"
                    >
                      {simulating ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RotateCcw className="h-4 w-4" />
                      )}
                      {simulating ? 'Simulating...' : 'Simulate Day +1'}
                    </button>
                  </div>
                </div>
              </Card>

              <Card className="border border-border p-6 rounded-2xl">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 flex items-center justify-center rounded-full bg-red-100 text-red-700 shrink-0">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div className="space-y-3 flex-1">
                    <div>
                      <h3 className="font-bold text-foreground">Process Overdue Orders</h3>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        Find all orders that exceed their delivery SLA (Instant: 12h, Next Day: 24h,
                        Regular: 3 days) and apply auto-refund or auto-return.
                      </p>
                    </div>
                    <button
                      onClick={handleProcessOverdue}
                      disabled={processing}
                      className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer border-none"
                    >
                      {processing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RotateCcw className="h-4 w-4" />
                      )}
                      {processing ? 'Processing...' : 'Process Overdue Orders'}
                    </button>
                  </div>
                </div>
              </Card>
            </div>

            {processResult && (
              <Card className="border border-border p-6 rounded-2xl">
                <div className="flex items-center gap-3 mb-4">
                  {processResult.processedCount > 0 ? (
                    <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                  ) : (
                    <XCircle className="h-6 w-6 text-muted-foreground" />
                  )}
                  <div>
                    <h3 className="font-bold text-foreground text-lg">
                      {processResult.processedCount > 0
                        ? `${processResult.processedCount} Overdue Order(s) Processed`
                        : 'No Overdue Orders Found'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {processResult.processedCount > 0
                        ? 'The following orders were auto-refunded or returned:'
                        : 'All orders are within their delivery SLA.'}
                    </p>
                  </div>
                </div>
                {processResult.details.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                      <thead>
                        <tr className="bg-muted/40 border-b border-border text-muted-foreground font-semibold">
                          <th className="p-3 pl-0">Order ID</th>
                          <th className="p-3">Status</th>
                          <th className="p-3">Refund Amount</th>
                          <th className="p-3 pr-0">Stock Restored</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {processResult.details.map((d) => (
                          <tr key={d.orderId} className="hover:bg-muted/20 transition-colors">
                            <td className="p-3 pl-0 font-mono text-xs text-foreground">
                              {d.orderId.slice(0, 8)}...
                            </td>
                            <td className="p-3">
                              <Badge variant="destructive">Dikembalikan</Badge>
                            </td>
                            <td className="p-3 font-semibold text-emerald-600">
                              {formatIdr(d.refundAmount)}
                            </td>
                            <td className="p-3 pr-0">
                              {d.stockRestored ? (
                                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                              ) : (
                                <XCircle className="h-4 w-4 text-muted-foreground" />
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
