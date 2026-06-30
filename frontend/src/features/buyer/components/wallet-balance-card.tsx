import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Wallet } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

interface WalletBalanceCardProps {
  balance: number | undefined;
  isLoading: boolean;
}

export function WalletBalanceCard({ balance, isLoading }: WalletBalanceCardProps) {
  const { t } = useTranslation();

  return (
    <Card className="bg-gradient-to-br from-slate-900 to-blue-950 text-white border-0 shadow-lg relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -z-0" />
      <CardHeader className="relative z-10">
        <CardTitle className="text-sm font-semibold tracking-wider text-slate-300 uppercase flex items-center gap-2">
          <Wallet className="h-4 w-4" /> {t('buyer.wallet.title')}
        </CardTitle>
        <CardDescription className="text-slate-400">
          {t('buyer.wallet.activeBalance')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 relative z-10">
        <div className="text-4xl font-extrabold tracking-tight">
          {isLoading ? (
            <span className="h-10 w-48 bg-slate-800 animate-pulse block rounded" />
          ) : (
            formatCurrency(balance || 0)
          )}
        </div>
        <div className="text-xs text-slate-300 border-t border-slate-800/80 pt-4 flex items-center justify-between">
          <span>
            {t('buyer.wallet.status')}: {t('buyer.wallet.active')}
          </span>
          <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
        </div>
      </CardContent>
    </Card>
  );
}
