import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowDownToLine } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { PRESET_AMOUNTS } from '../constants/wallet-constants';
import { useTranslation } from 'react-i18next';

interface TopUpFormProps {
  topUpAmount: number;
  customAmount: string;
  isPending: boolean;
  onPresetSelect: (amount: number) => void;
  onCustomAmountChange: (value: string) => void;
  onSubmit: () => void;
}

export function TopUpForm({
  topUpAmount,
  customAmount,
  isPending,
  onPresetSelect,
  onCustomAmountChange,
  onSubmit,
}: TopUpFormProps) {
  const { t } = useTranslation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <Card className="border border-border shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowDownToLine className="h-5 w-5 text-blue-500" /> {t('buyer.wallet.topUpTitle')}
        </CardTitle>
        <CardDescription>{t('buyer.wallet.topUpDesc')}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Amount Presets */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              {t('buyer.wallet.selectAmount')}
            </label>
            <div className="flex flex-wrap gap-3">
              {PRESET_AMOUNTS.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => onPresetSelect(amt)}
                  className={`flex-1 min-w-[100px] text-center py-2.5 px-3 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                    topUpAmount === amt && !customAmount
                      ? 'bg-blue-500 border-blue-500 text-white'
                      : 'bg-card border-border hover:border-blue-500/50 hover:bg-slate-50'
                  }`}
                >
                  {formatCurrency(amt)}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Amount */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              {t('buyer.wallet.orCustomAmount')}
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-sm font-semibold text-muted-foreground">
                Rp
              </span>
              <Input
                type="number"
                placeholder={t('buyer.wallet.minCustomAmount')}
                value={customAmount}
                onChange={(e) => onCustomAmountChange(e.target.value)}
                className="pl-10"
                min="10000"
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-6 rounded-xl"
            disabled={isPending}
          >
            {isPending ? t('buyer.wallet.topUp') + '...' : t('buyer.wallet.topUp')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
