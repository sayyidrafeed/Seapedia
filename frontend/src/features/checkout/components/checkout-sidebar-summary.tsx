import { Link } from '@tanstack/react-router';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { OrderPriceSummary } from '@/components/orders/order-price-summary';
import { Wallet, AlertCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import type { DeliveryMethod } from '../constants/delivery-options';

interface Preview {
  subtotal: number;
  discountAmount: number;
  discountCode?: unknown;
  discountType?: unknown;
  deliveryFee: number;
  ppn: number;
  totalAmount: number;
}

interface CheckoutSidebarSummaryProps {
  walletBalance: number;
  preview: Preview | null | undefined;
  deliveryMethod: DeliveryMethod;
  hasNoAddress: boolean;
  isPreviewLoading: boolean;
  isSubmitting: boolean;
  onSubmit: () => void;
}

export function CheckoutSidebarSummary({
  walletBalance,
  preview,
  deliveryMethod,
  hasNoAddress,
  isPreviewLoading,
  isSubmitting,
  onSubmit,
}: CheckoutSidebarSummaryProps) {
  const finalTotal = preview?.totalAmount || 0;
  const isBalanceInsufficient = walletBalance < finalTotal;

  return (
    <Card className="border border-border/80 shadow-sm p-6 space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-border/60">
        <div className="flex items-center gap-2">
          <Wallet className="h-5 w-5 text-primary" />
          <span className="text-sm font-bold text-foreground">Your Balance</span>
        </div>
        <span className="font-black text-foreground">{formatCurrency(walletBalance)}</span>
      </div>

      {isPreviewLoading ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-4 bg-muted rounded w-1/3" />
          <div className="h-20 bg-muted rounded" />
        </div>
      ) : preview ? (
        <OrderPriceSummary
          subtotal={preview.subtotal}
          discountAmount={preview.discountAmount}
          discountCode={(preview.discountCode as string | null) || null}
          discountType={(preview.discountType as string | null) || null}
          deliveryFee={preview.deliveryFee}
          ppn={preview.ppn}
          totalAmount={preview.totalAmount}
          deliveryMethod={deliveryMethod}
        />
      ) : null}

      {/* Error alerts */}
      {hasNoAddress ? (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded-lg p-3.5 flex gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>Please configure a default shipping address to proceed.</span>
        </div>
      ) : isBalanceInsufficient ? (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded-lg p-3.5 flex flex-col gap-2">
          <div className="flex gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>
              <strong>Insufficient wallet balance.</strong> You need at least{' '}
              {formatCurrency(finalTotal)} to check out.
            </span>
          </div>
          <Link
            to="/dashboard/buyer/wallet"
            className="text-primary font-semibold hover:underline mt-1 self-start"
          >
            Top Up Wallet →
          </Link>
        </div>
      ) : null}

      <Button
        className="w-full h-11 text-base font-bold shadow-md cursor-pointer"
        disabled={hasNoAddress || isBalanceInsufficient || isSubmitting || isPreviewLoading}
        onClick={onSubmit}
      >
        {isSubmitting ? 'Processing Checkout...' : 'Pay & Confirm Order'}
      </Button>

      <p className="text-[10px] text-center text-muted-foreground leading-relaxed">
        By confirming, your wallet will be charged immediately. Purchases are protected by the
        Seapedia Guarantee.
      </p>
    </Card>
  );
}
