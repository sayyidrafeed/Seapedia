import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Ticket, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface CreateVoucherFormProps {
  vCode: string;
  vAmount: string;
  vMinOrder: string;
  vUsage: string;
  vExpiry: string;
  isPending: boolean;
  onCodeChange: (val: string) => void;
  onAmountChange: (val: string) => void;
  onMinOrderChange: (val: string) => void;
  onUsageChange: (val: string) => void;
  onExpiryChange: (val: string) => void;
  onSubmit: () => void;
}

export function CreateVoucherForm({
  vCode,
  vAmount,
  vMinOrder,
  vUsage,
  vExpiry,
  isPending,
  onCodeChange,
  onAmountChange,
  onMinOrderChange,
  onUsageChange,
  onExpiryChange,
  onSubmit,
}: CreateVoucherFormProps) {
  const { t } = useTranslation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <Card className="border border-border/80 shadow-sm animate-in slide-in-from-right duration-300">
      <CardHeader className="bg-muted/30 border-b border-border/80">
        <CardTitle className="text-base font-extrabold flex items-center gap-2">
          <Ticket className="h-4 w-4 text-primary" /> {t('admin.discounts.createVoucherTitle')}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-foreground uppercase tracking-wider">
              {t('admin.discounts.voucherCodeLabel')}
            </label>
            <Input
              type="text"
              placeholder="e.g. SAVE20"
              value={vCode}
              onChange={(e) => onCodeChange(e.target.value)}
              className="font-mono uppercase placeholder:font-sans placeholder:normal-case h-10 border-border"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-foreground uppercase tracking-wider">
              {t('admin.discounts.discountValueLabel')}
            </label>
            <Input
              type="number"
              placeholder="e.g. 20000"
              value={vAmount}
              onChange={(e) => onAmountChange(e.target.value)}
              className="h-10 border-border"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-foreground uppercase tracking-wider">
              {t('admin.discounts.minOrderLabel')}
            </label>
            <Input
              type="number"
              placeholder="e.g. 50000 (0 for no limit)"
              value={vMinOrder}
              onChange={(e) => onMinOrderChange(e.target.value)}
              className="h-10 border-border"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-foreground uppercase tracking-wider">
              {t('admin.discounts.maxUsageLabel')}
            </label>
            <Input
              type="number"
              placeholder="e.g. 10"
              value={vUsage}
              onChange={(e) => onUsageChange(e.target.value)}
              className="h-10 border-border"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-foreground uppercase tracking-wider">
              {t('admin.discounts.expiryLabel')}
            </label>
            <Input
              type="datetime-local"
              value={vExpiry}
              onChange={(e) => onExpiryChange(e.target.value)}
              className="h-10 border-border"
              required
            />
          </div>

          <Button
            type="submit"
            className="w-full h-11 font-bold rounded-xl mt-4 cursor-pointer"
            disabled={isPending}
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            {t('admin.discounts.newVoucher')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
