import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Percent, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface CreatePromoFormProps {
  pCode: string;
  pPercent: string;
  pMaxDiscount: string;
  pMinOrder: string;
  pExpiry: string;
  isPending: boolean;
  onCodeChange: (val: string) => void;
  onPercentChange: (val: string) => void;
  onMaxDiscountChange: (val: string) => void;
  onMinOrderChange: (val: string) => void;
  onExpiryChange: (val: string) => void;
  onSubmit: () => void;
}

export function CreatePromoForm({
  pCode,
  pPercent,
  pMaxDiscount,
  pMinOrder,
  pExpiry,
  isPending,
  onCodeChange,
  onPercentChange,
  onMaxDiscountChange,
  onMinOrderChange,
  onExpiryChange,
  onSubmit,
}: CreatePromoFormProps) {
  const { t } = useTranslation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <Card className="border border-border/80 shadow-sm animate-in slide-in-from-right duration-300">
      <CardHeader className="bg-muted/30 border-b border-border/80">
        <CardTitle className="text-base font-extrabold flex items-center gap-2">
          <Percent className="h-4 w-4 text-primary" /> {t('admin.discounts.createPromoTitle')}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-foreground uppercase tracking-wider">
              {t('admin.discounts.promoCodeLabel')}
            </label>
            <Input
              type="text"
              placeholder="e.g. PROMO15"
              value={pCode}
              onChange={(e) => onCodeChange(e.target.value)}
              className="font-mono uppercase placeholder:font-sans placeholder:normal-case h-10 border-border"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-foreground uppercase tracking-wider">
              {t('admin.discounts.discountPercentLabel')}
            </label>
            <Input
              type="number"
              placeholder="e.g. 15"
              min="1"
              max="100"
              value={pPercent}
              onChange={(e) => onPercentChange(e.target.value)}
              className="h-10 border-border"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-foreground uppercase tracking-wider">
              {t('admin.discounts.maxDiscountLabel')}
            </label>
            <Input
              type="number"
              placeholder="e.g. 30000 (empty for no cap)"
              value={pMaxDiscount}
              onChange={(e) => onMaxDiscountChange(e.target.value)}
              className="h-10 border-border"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-foreground uppercase tracking-wider">
              {t('admin.discounts.minOrderLabel')}
            </label>
            <Input
              type="number"
              placeholder="e.g. 30000 (0 for no limit)"
              value={pMinOrder}
              onChange={(e) => onMinOrderChange(e.target.value)}
              className="h-10 border-border"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-foreground uppercase tracking-wider">
              {t('admin.discounts.expiryLabel')}
            </label>
            <Input
              type="datetime-local"
              value={pExpiry}
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
            {t('admin.discounts.newPromo')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
