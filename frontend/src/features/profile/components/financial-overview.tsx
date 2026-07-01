import { formatCurrency } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">{t('profile.financialOverview')}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {/* Buyer Card */}
        <FinancialCard
          title={t('profile.buyerWallet')}
          value={financialSummary?.buyer?.balance}
          isActive={financialSummary?.buyer !== undefined}
          isLoading={isLoading}
          subtext={t('profile.buyerWalletDesc')}
        />

        {/* Seller Card */}
        <FinancialCard
          title={t('profile.sellerEarnings')}
          value={financialSummary?.seller?.income}
          isActive={financialSummary?.seller !== undefined}
          isLoading={isLoading}
          subtext={t('profile.sellerEarningsDesc')}
        />

        {/* Driver Card */}
        <FinancialCard
          title={t('profile.driverPayouts')}
          value={financialSummary?.driver?.earnings}
          isActive={financialSummary?.driver !== undefined}
          isLoading={isLoading}
          subtext={t('profile.driverPayoutsDesc')}
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
  const { t } = useTranslation();

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
            {t('profile.notOwned')}
          </span>
        )}
      </div>
      {isLoading ? (
        <p className="text-2xl font-bold text-foreground mt-2 animate-pulse">...</p>
      ) : isActive && value !== undefined ? (
        <p className="text-2xl font-bold text-foreground mt-2">{formatCurrency(value)}</p>
      ) : (
        <p className="text-sm font-medium text-muted-foreground mt-2.5 italic">
          {t('profile.roleNotActive')}
        </p>
      )}
      <p className="text-xs text-muted-foreground mt-1">{subtext}</p>
    </div>
  );
}
