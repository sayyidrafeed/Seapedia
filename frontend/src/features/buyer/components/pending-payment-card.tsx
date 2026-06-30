import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, Copy, AlertCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import { PAYMENT_METHODS } from '../constants/wallet-constants';

interface PendingPayment {
  transactionId: string;
  amount: number;
  paymentMethod: string;
  virtualAccount: string;
}

interface PendingPaymentCardProps {
  pendingPayment: PendingPayment;
  isSimulating: boolean;
  onCancel: () => void;
  onSimulateSuccess: () => void;
}

export function PendingPaymentCard({
  pendingPayment,
  isSimulating,
  onCancel,
  onSimulateSuccess,
}: PendingPaymentCardProps) {
  const copyToClipboard = (text: string) => {
    if (navigator.clipboard) {
      navigator.clipboard
        .writeText(text)
        .then(() => toast.success('Copied to clipboard!'))
        .catch(() => toast.error('Failed to copy to clipboard'));
    } else {
      toast.error('Clipboard not supported in this browser');
    }
  };

  const methodName =
    PAYMENT_METHODS.find((m) => m.id === pendingPayment.paymentMethod)?.name ||
    pendingPayment.paymentMethod;

  return (
    <Card className="border border-blue-500/20 bg-blue-500/[0.01] shadow-md relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-blue-500" />
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <Clock className="h-5 w-5 text-blue-500 animate-spin" /> Menunggu Pembayaran
        </CardTitle>
        <CardDescription>
          Please simulate payment below to complete your top-up request.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* VA/Payment Info Card */}
        <div className="bg-card border border-border p-5 rounded-xl space-y-4">
          <div className="flex justify-between items-center text-sm border-b border-border/50 pb-3">
            <span className="text-muted-foreground">Payment Method</span>
            <span className="font-semibold text-foreground">{methodName}</span>
          </div>

          <div className="flex justify-between items-center text-sm border-b border-border/50 pb-3">
            <span className="text-muted-foreground">Total Top-Up</span>
            <span className="text-lg font-bold text-foreground">
              {formatCurrency(pendingPayment.amount)}
            </span>
          </div>

          <div className="space-y-1.5 pt-1">
            <span className="text-xs text-muted-foreground block">Virtual Account / Code</span>
            <div className="flex items-center justify-between bg-slate-50 border border-border p-3 rounded-lg">
              <span className="font-mono text-lg font-extrabold text-foreground tracking-wider">
                {pendingPayment.virtualAccount}
              </span>
              <button
                onClick={() => copyToClipboard(pendingPayment.virtualAccount)}
                className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-slate-200/50 rounded-md transition-all"
                type="button"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="bg-blue-500/5 border border-blue-500/10 p-4 rounded-xl flex gap-3 text-xs text-blue-600 leading-relaxed">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <div>
            <span className="font-bold block mb-0.5">Instructions:</span>
            Since this is a simulated sandbox flow, use the button below to simulate successfully
            paying the generated Virtual Account code.
          </div>
        </div>

        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={onCancel}
            disabled={isSimulating}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold"
            onClick={onSimulateSuccess}
            disabled={isSimulating}
          >
            {isSimulating ? 'Simulating...' : 'Simulate Payment Success'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
