import { Link } from '@tanstack/react-router';
import { Wallet, ArrowRight } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

interface BuyerWalletCardProps {
  balance: number | undefined;
  isLoading: boolean;
}

export function BuyerWalletCard({ balance, isLoading }: BuyerWalletCardProps) {
  const { t } = useTranslation();
  const balanceFormatted = balance !== undefined ? formatCurrency(balance) : 'Rp 0';

  return (
    <div className="bg-card border border-border p-6 rounded-xl shadow-sm flex flex-col justify-between group hover:border-blue-500/20 transition-all duration-300">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {t('buyer.wallet.title')}
          </span>
          <div className="text-3xl font-extrabold text-foreground tracking-tight mt-1">
            {isLoading ? (
              <span className="h-8 w-32 bg-muted animate-pulse block rounded" />
            ) : (
              balanceFormatted
            )}
          </div>
        </div>
        <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl">
          <Wallet className="h-6 w-6" />
        </div>
      </div>
      <div className="mt-8 border-t border-border/50 pt-4 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{t('buyer.wallet.activeBalance')}</span>
        <Link
          to="/dashboard/buyer/wallet"
          className="text-sm font-semibold text-blue-500 hover:text-blue-600 flex items-center gap-1 group-hover:gap-2 transition-all"
        >
          {t('buyer.wallet.topUp')} <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
