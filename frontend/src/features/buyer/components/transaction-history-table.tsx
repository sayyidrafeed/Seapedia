import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowUpRight, TrendingDown, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { PAYMENT_METHODS } from '../constants/wallet-constants';

interface Transaction {
  id: string;
  createdAt: string;
  type: string;
  paymentMethod: unknown;
  reference: string;
  status: string;
  amount: number;
}

interface TransactionHistoryTableProps {
  transactions: Transaction[] | undefined;
  isLoading: boolean;
}

export function TransactionHistoryTable({ transactions, isLoading }: TransactionHistoryTableProps) {
  return (
    <Card className="border border-border shadow-sm">
      <CardHeader>
        <CardTitle>Riwayat Transaksi (Transaction History)</CardTitle>
        <CardDescription>
          List of all incoming and outgoing transaction logs for your wallet.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
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
                  const methodName =
                    PAYMENT_METHODS.find((m) => m.id === (tx.paymentMethod as string))?.name ||
                    (tx.paymentMethod as string) ||
                    '-';

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
                        <p className="font-medium text-foreground">{methodName}</p>
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
                        {isCredit ? '+' : '-'} {formatCurrency(tx.amount)}
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
  );
}
