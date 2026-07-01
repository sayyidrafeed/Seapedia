import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowDownToLine } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { PRESET_AMOUNTS, PAYMENT_METHODS } from '../constants/wallet-constants';
import { useTranslation } from 'react-i18next';

interface TopUpFormProps {
  topUpAmount: number;
  customAmount: string;
  selectedMethod: string;
  isPending: boolean;
  onPresetSelect: (amount: number) => void;
  onCustomAmountChange: (value: string) => void;
  onMethodSelect: (method: string) => void;
  onSubmit: () => void;
}

export function TopUpForm({
  topUpAmount,
  customAmount,
  selectedMethod,
  isPending,
  onPresetSelect,
  onCustomAmountChange,
  onMethodSelect,
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
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {PRESET_AMOUNTS.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => onPresetSelect(amt)}
                  className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all ${
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

          {/* Payment Method */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              {t('buyer.wallet.selectPaymentChannel')}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PAYMENT_METHODS.map((method) => (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => onMethodSelect(method.id)}
                  className={`flex items-center justify-between p-4 rounded-xl border text-left transition-all ${
                    selectedMethod === method.id
                      ? 'border-blue-500 bg-blue-500/5 ring-1 ring-blue-500'
                      : 'border-border bg-card hover:border-blue-500/30'
                  }`}
                >
                  <div>
                    <p className="font-semibold text-sm text-foreground">{method.name}</p>
                    <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                      {method.type}
                    </span>
                  </div>
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      selectedMethod === method.id
                        ? 'border-blue-500 bg-blue-500 text-white'
                        : 'border-muted-foreground/30'
                    }`}
                  >
                    {selectedMethod === method.id && (
                      <div className="w-1.5 h-1.5 bg-white rounded-full" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-6 rounded-xl"
            disabled={isPending}
          >
            {isPending ? t('buyer.wallet.generatingInstructions') : t('buyer.wallet.requestTopUp')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
