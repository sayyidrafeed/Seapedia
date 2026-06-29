import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getBuyerWalletOptions,
  getWalletTransactionsOptions,
} from '@/lib/api/generated/@tanstack/react-query.gen';
import { requestTopUp, simulateTopUp } from '@/lib/api/generated';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  Wallet,
  ArrowDownToLine,
  CheckCircle2,
  Clock,
  AlertCircle,
  Copy,
  ArrowUpRight,
  TrendingDown,
} from 'lucide-react';

export const Route = createFileRoute('/dashboard/buyer/wallet')({
  component: BuyerWalletPage,
});

const PRESET_AMOUNTS = [20000, 50000, 100000, 250000, 500000];

const PAYMENT_METHODS = [
  { id: 'BCA_VA', name: 'BCA Virtual Account', type: 'VA' },
  { id: 'MANDIRI_VA', name: 'Mandiri Virtual Account', type: 'VA' },
  { id: 'GOPAY', name: 'GoPay E-Wallet', type: 'E-WALLET' },
  { id: 'OVO', name: 'OVO E-Wallet', type: 'E-WALLET' },
];

function BuyerWalletPage() {
  const queryClient = useQueryClient();
  const [topUpAmount, setTopUpAmount] = useState<number>(50000);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [selectedMethod, setSelectedMethod] = useState<string>('BCA_VA');

  // Pending top-up step
  const [pendingPayment, setPendingPayment] = useState<{
    transactionId: string;
    amount: number;
    paymentMethod: string;
    virtualAccount: string;
  } | null>(null);

  // Queries
  const { data: wallet, isLoading: isWalletLoading } = useQuery({
    ...getBuyerWalletOptions(),
    retry: false,
  });

  const { data: transactions, isLoading: isTxLoading } = useQuery({
    ...getWalletTransactionsOptions(),
    retry: false,
  });

  // Mutations
  const requestTopUpMutation = useMutation({
    mutationFn: async (vars: { amount: number; paymentMethod: string }) => {
      const { data, error } = await requestTopUp({
        body: vars,
      });
      if (error) {
        throw new Error(error.error || 'Failed to create top-up request');
      }
      return data;
    },
    onSuccess: (data) => {
      if (data && data.transaction) {
        setPendingPayment({
          transactionId: data.transaction.id,
          amount: data.transaction.amount,
          paymentMethod: (data.transaction.paymentMethod as string) || selectedMethod,
          virtualAccount: data.paymentInstructions.virtualAccount || '',
        });
        toast.success('Top-up request generated!');
      }
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const simulatePaymentMutation = useMutation({
    mutationFn: async (transactionId: string) => {
      const { data, error } = await simulateTopUp({
        path: { transactionId },
      });
      if (error) {
        throw new Error(error.error || 'Failed to simulate payment');
      }
      return data;
    },
    onSuccess: () => {
      toast.success('Payment simulated successfully! Balance updated.');
      setPendingPayment(null);
      // Invalidate queries to refresh balance & history
      queryClient.invalidateQueries({ queryKey: ['getBuyerWallet'] });
      queryClient.invalidateQueries({ queryKey: ['getWalletTransactions'] });
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const formatIDR = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(val);
  };

  const handlePresetSelect = (amount: number) => {
    setTopUpAmount(amount);
    setCustomAmount('');
  };

  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomAmount(val);
    const parsed = parseInt(val, 10);
    if (!isNaN(parsed)) {
      setTopUpAmount(parsed);
    }
  };

  const handleRequestTopUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (topUpAmount < 10000) {
      toast.error('Minimum top-up amount is Rp 10.000');
      return;
    }
    requestTopUpMutation.mutate({
      amount: topUpAmount,
      paymentMethod: selectedMethod,
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  return (
    <div className="space-y-8">
      {/* Wallet overview and actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Balance Display */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="bg-gradient-to-br from-slate-900 to-blue-950 text-white border-0 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -z-0" />
            <CardHeader className="relative z-10">
              <CardTitle className="text-sm font-semibold tracking-wider text-slate-300 uppercase flex items-center gap-2">
                <Wallet className="h-4 w-4" /> Seapedia Wallet
              </CardTitle>
              <CardDescription className="text-slate-400">Current active balance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 relative z-10">
              <div className="text-4xl font-extrabold tracking-tight">
                {isWalletLoading ? (
                  <span className="h-10 w-48 bg-slate-800 animate-pulse block rounded" />
                ) : (
                  formatIDR(wallet?.balance || 0)
                )}
              </div>
              <div className="text-xs text-slate-300 border-t border-slate-800/80 pt-4 flex items-center justify-between">
                <span>Status: Active</span>
                <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top-up Form / Payment Simulation Area */}
        <div className="lg:col-span-2">
          {!pendingPayment ? (
            <Card className="border border-border shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowDownToLine className="h-5 w-5 text-blue-500" /> Isi Saldo (Top Up)
                </CardTitle>
                <CardDescription>
                  Choose amount and payment method to generate instructions.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleRequestTopUp} className="space-y-6">
                  {/* Amount Presets */}
                  <div className="space-y-2.5">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Select Amount
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                      {PRESET_AMOUNTS.map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => handlePresetSelect(amt)}
                          className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all ${
                            topUpAmount === amt && !customAmount
                              ? 'bg-blue-500 border-blue-500 text-white'
                              : 'bg-card border-border hover:border-blue-500/50 hover:bg-slate-50'
                          }`}
                        >
                          {formatIDR(amt)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom Amount */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Or Enter Custom Amount
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-2.5 text-sm font-semibold text-muted-foreground">
                        Rp
                      </span>
                      <Input
                        type="number"
                        placeholder="Min. 10.000"
                        value={customAmount}
                        onChange={handleCustomAmountChange}
                        className="pl-10"
                        min="10000"
                      />
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div className="space-y-2.5">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Select Payment Channel
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {PAYMENT_METHODS.map((method) => (
                        <button
                          key={method.id}
                          type="button"
                          onClick={() => setSelectedMethod(method.id)}
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
                    disabled={requestTopUpMutation.isPending}
                  >
                    {requestTopUpMutation.isPending
                      ? 'Generating Instructions...'
                      : 'Request Top-Up'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          ) : (
            /* Payment Simulation Instruction Screen */
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
                    <span className="font-semibold text-foreground">
                      {PAYMENT_METHODS.find((m) => m.id === pendingPayment.paymentMethod)?.name ||
                        pendingPayment.paymentMethod}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-sm border-b border-border/50 pb-3">
                    <span className="text-muted-foreground">Total Top-Up</span>
                    <span className="text-lg font-bold text-foreground">
                      {formatIDR(pendingPayment.amount)}
                    </span>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <span className="text-xs text-muted-foreground block">
                      Virtual Account / Code
                    </span>
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
                    Since this is a simulated sandbox flow, use the button below to simulate
                    successfully paying the generated Virtual Account code.
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setPendingPayment(null)}
                    disabled={simulatePaymentMutation.isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold"
                    onClick={() => simulatePaymentMutation.mutate(pendingPayment.transactionId)}
                    disabled={simulatePaymentMutation.isPending}
                  >
                    {simulatePaymentMutation.isPending
                      ? 'Simulating...'
                      : 'Simulate Payment Success'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Transaction History Section */}
      <Card className="border border-border shadow-sm">
        <CardHeader>
          <CardTitle>Riwayat Transaksi (Transaction History)</CardTitle>
          <CardDescription>
            List of all incoming and outgoing transaction logs for your wallet.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isTxLoading ? (
            <div className="space-y-3 py-6">
              <div className="h-8 bg-muted animate-pulse rounded w-full" />
              <div className="h-8 bg-muted animate-pulse rounded w-full" />
              <div className="h-8 bg-muted animate-pulse rounded w-full" />
            </div>
          ) : !transactions || transactions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No transactions recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead>
                  <tr className="border-b border-border/80 text-muted-foreground text-xs uppercase tracking-wider font-semibold">
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4">Type</th>
                    <th className="py-3.5 px-4">Method / Ref</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {transactions.map((tx) => {
                    const isCredit = tx.type === 'topup' || tx.type === 'refund';
                    return (
                      <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-4 text-muted-foreground whitespace-nowrap">
                          {new Date(tx.createdAt).toLocaleDateString('id-ID', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="py-4 px-4 font-semibold capitalize whitespace-nowrap">
                          <span className="flex items-center gap-1.5">
                            {isCredit ? (
                              <ArrowUpRight className="h-3.5 w-3.5 text-green-500" />
                            ) : (
                              <TrendingDown className="h-3.5 w-3.5 text-red-500" />
                            )}
                            {tx.type}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <p className="font-medium text-foreground">
                            {PAYMENT_METHODS.find((m) => m.id === (tx.paymentMethod as string))
                              ?.name ||
                              (tx.paymentMethod as string) ||
                              '-'}
                          </p>
                          <span className="text-xs font-mono text-muted-foreground">
                            Ref: {tx.reference}
                          </span>
                        </td>
                        <td className="py-4 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full ${
                              tx.status === 'success'
                                ? 'bg-green-500/10 text-green-600'
                                : tx.status === 'pending'
                                  ? 'bg-amber-500/10 text-amber-600'
                                  : 'bg-red-500/10 text-red-600'
                            }`}
                          >
                            {tx.status === 'success' && <CheckCircle2 className="h-3 w-3" />}
                            {tx.status === 'pending' && <Clock className="h-3 w-3 animate-pulse" />}
                            {tx.status === 'failed' && <AlertCircle className="h-3 w-3" />}
                            {tx.status}
                          </span>
                        </td>
                        <td
                          className={`py-4 px-4 text-right font-extrabold whitespace-nowrap ${
                            isCredit ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {isCredit ? '+' : '-'} {formatIDR(tx.amount)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
