import { formatCurrency } from '@/lib/utils';

interface FinancialMetric {
  balance?: number;
  income?: number;
  earnings?: number;
}

interface FinancialSummary {
  buyer?: FinancialMetric;
  seller?: FinancialMetric;
  driver?: FinancialMetric;
}

interface FinancialOverviewProps {
  financialSummary: FinancialSummary | undefined;
  isLoading: boolean;
}

export function FinancialOverview({ financialSummary, isLoading }: FinancialOverviewProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Financial Overview</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {/* Buyer Card */}
        <FinancialCard
          title="Buyer Wallet Balance"
          value={financialSummary?.buyer?.balance}
          isActive={financialSummary?.buyer !== undefined}
          isLoading={isLoading}
          subtext="Simulated transaction wallet"
        />

        {/* Seller Card */}
        <FinancialCard
          title="Seller Earnings"
          value={financialSummary?.seller?.income}
          isActive={financialSummary?.seller !== undefined}
          isLoading={isLoading}
          subtext="Accumulated store sales revenue"
        />

        {/* Driver Card */}
        <FinancialCard
          title="Driver Payouts"
          value={financialSummary?.driver?.earnings}
          isActive={financialSummary?.driver !== undefined}
          isLoading={isLoading}
          subtext="Completed shipping job payouts"
        />
      </div>
    </div>
  );
}

interface FinancialCardProps {
  title: string;
  value: number | undefined;
  isActive: boolean;
  isLoading: boolean;
  subtext: string;
}

function FinancialCard({ title, value, isActive, isLoading, subtext }: FinancialCardProps) {
  return (
    <div
      className={`bg-card border p-6 rounded-lg shadow-sm transition-opacity duration-200 ${
        !isActive ? 'border-border/40 opacity-60' : 'border-border'
      }`}
    >
      <div className="flex justify-between items-start">
        <span className="text-xs font-semibold text-muted-foreground uppercase">{title}</span>
        {!isActive && (
          <span className="text-[10px] font-semibold text-muted-foreground/80 bg-secondary px-1.5 py-0.5 rounded">
            Not Owned
          </span>
        )}
      </div>
      {isLoading ? (
        <p className="text-2xl font-bold text-foreground mt-2 animate-pulse">...</p>
      ) : isActive && value !== undefined ? (
        <p className="text-2xl font-bold text-foreground mt-2">{formatCurrency(value)}</p>
      ) : (
        <p className="text-sm font-medium text-muted-foreground mt-2.5 italic">Role not active</p>
      )}
      <p className="text-xs text-muted-foreground mt-1">{subtext}</p>
    </div>
  );
}
