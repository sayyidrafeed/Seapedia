import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import { useAuth } from '@/lib/auth/context';
import { useAdminDashboard } from '@/features/admin/hooks/use-admin-dashboard';
import { AdminKpiGrid } from '@/features/admin/components/admin-kpi-grid';
import { AdminChartSection } from '@/features/admin/components/admin-chart-section';
import { TimeSimulationControls } from '@/features/admin/components/time-simulation-controls';
import { Loader2, AlertTriangle } from 'lucide-react';

export const Route = createFileRoute('/dashboard/admin/')({
  component: AdminDashboardIndex,
});

function AdminDashboardIndex() {
  const auth = useAuth();
  const navigate = useNavigate();
  const isAdminActive = auth.activeRole === 'admin';

  useEffect(() => {
    if (!auth.isLoading && !isAdminActive) {
      navigate({ to: '/select-role' });
    }
  }, [auth.isLoading, isAdminActive, navigate]);

  const {
    stats,
    isLoading,
    error,
    isSimulating,
    isProcessingOverdue,
    simulateTime,
    processOverdueOrders,
  } = useAdminDashboard(isAdminActive);

  if (auth.isLoading || !isAdminActive) {
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

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-muted-foreground text-sm">
            Comprehensive real-time monitoring of SEAPEDIA marketplace system.
          </p>
        </div>
        <TimeSimulationControls isPending={isSimulating} onSimulate={simulateTime} />
      </div>

      {/* KPI Cards */}
      <AdminKpiGrid
        stats={stats}
        isProcessingOverdue={isProcessingOverdue}
        onProcessOverdue={processOverdueOrders}
      />

      {/* Visualizations Section */}
      <AdminChartSection stats={stats} />
    </div>
  );
}
