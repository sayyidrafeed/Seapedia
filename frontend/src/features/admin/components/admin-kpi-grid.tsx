import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Store, ShoppingBag, AlertTriangle, Loader2 } from 'lucide-react';

interface KPIStats {
  users: { total: number };
  stores: { total: number };
  products: { total: number };
  overdueOrders: { total: number };
}

interface AdminKpiGridProps {
  stats: KPIStats;
  isProcessingOverdue: boolean;
  onProcessOverdue: () => void;
}

export function AdminKpiGrid({ stats, isProcessingOverdue, onProcessOverdue }: AdminKpiGridProps) {
  const hasOverdue = stats.overdueOrders.total > 0;

  return (
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
          hasOverdue
            ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50'
            : ''
        }`}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle
            className={`text-xs font-semibold uppercase tracking-wider ${
              hasOverdue ? 'text-rose-600 dark:text-rose-400' : 'text-muted-foreground'
            }`}
          >
            Overdue Orders
          </CardTitle>
          <AlertTriangle
            className={`h-4 w-4 ${
              hasOverdue ? 'text-rose-500 animate-bounce' : 'text-muted-foreground'
            }`}
          />
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div
              className={`text-2xl font-bold ${
                hasOverdue ? 'text-rose-600 dark:text-rose-400' : 'text-foreground'
              }`}
            >
              {stats.overdueOrders.total}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              Active orders past delivery SLA
            </p>
          </div>
          {hasOverdue && (
            <Button
              variant="destructive"
              size="sm"
              className="w-full font-bold rounded-lg text-xs py-1.5 h-auto cursor-pointer"
              onClick={onProcessOverdue}
              disabled={isProcessingOverdue}
            >
              {isProcessingOverdue ? (
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
  );
}
