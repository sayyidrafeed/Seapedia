import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { validateDiscountCode } from '@/lib/api/generated';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Ticket, X, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface DiscountCodeInputProps {
  subtotal: number;
  appliedCode: string | null;
  appliedType: string | null;
  appliedAmount: number | null;
  onApply: (
    code: string,
    discountAmount: number,
    discountType: 'voucher' | 'promo',
    description: string,
  ) => void;
  onRemove: () => void;
}

export function DiscountCodeInput({
  subtotal,
  appliedCode,
  appliedType,
  appliedAmount,
  onApply,
  onRemove,
}: DiscountCodeInputProps) {
  const [code, setCode] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const validateMutation = useMutation({
    mutationFn: async (codeToValidate: string) => {
      setErrorMsg(null);
      const { data, error } = await validateDiscountCode({
        body: {
          code: codeToValidate,
          subtotal,
        },
      });

      if (error) {
        throw new Error(error.error || 'Invalid discount code');
      }
      return data;
    },
    onSuccess: (data) => {
      onApply(data.code, data.discountAmount, data.type, data.description);
      setCode('');
    },
    onError: (err: Error) => {
      setErrorMsg(err.message);
    },
  });

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    validateMutation.mutate(code.trim());
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Ticket className="h-5 w-5 text-primary" />
        <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
          Discount Code
        </h3>
      </div>

      {appliedCode ? (
        <div className="flex items-center justify-between p-3.5 border rounded-xl bg-muted/30 border-primary/20 transition duration-200">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge
                className={
                  appliedType === 'voucher'
                    ? 'bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100 font-semibold'
                    : 'bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100 font-semibold'
                }
                variant="outline"
              >
                {appliedType === 'voucher' ? '🏷️ Voucher' : '🎉 Promo'}
              </Badge>
              <span className="font-mono font-bold text-sm text-foreground">{appliedCode}</span>
            </div>
            <p className="text-xs text-emerald-600 font-medium">
              Saved {formatCurrency(appliedAmount || 0)} on this order
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onRemove}
            className="rounded-full h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <form onSubmit={handleApply} className="flex gap-2">
          <div className="flex-1 space-y-1">
            <Input
              type="text"
              placeholder="Enter Voucher or Promo Code (e.g. SAVE20)"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="h-10 bg-card rounded-xl font-mono uppercase placeholder:font-sans placeholder:normal-case border-border"
              disabled={validateMutation.isPending}
            />
          </div>
          <Button
            type="submit"
            disabled={!code.trim() || validateMutation.isPending}
            className="h-10 px-4 rounded-xl cursor-pointer"
          >
            {validateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply'}
          </Button>
        </form>
      )}

      {errorMsg && (
        <p className="text-xs text-destructive font-medium pl-1 flex items-center gap-1.5">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-destructive" />
          {errorMsg}
        </p>
      )}
    </div>
  );
}
