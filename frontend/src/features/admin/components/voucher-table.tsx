import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Ticket, List } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { formatDiscountDate, isExpired } from '../utils/discount-utils';

interface Voucher {
  id: string;
  code: string;
  discountAmount: number;
  minOrderAmount: number;
  remainingUsage: number;
  expiresAt: string;
}

interface VoucherTableProps {
  vouchers: Voucher[] | undefined;
  isLoading: boolean;
}

export function VoucherTable({ vouchers, isLoading }: VoucherTableProps) {
  return (
    <Card className="border border-border/80 shadow-sm overflow-hidden">
      <CardHeader className="bg-muted/30 border-b border-border/80 p-6">
        <CardTitle className="text-xl font-extrabold flex items-center gap-2">
          <Ticket className="h-5 w-5 text-primary" /> Active Vouchers
        </CardTitle>
        <CardDescription>Flat IDR discounts with usage limits for buyer checkouts.</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-12 text-center text-muted-foreground animate-pulse">
            Loading vouchers...
          </div>
        ) : !vouchers || vouchers.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground space-y-2">
            <List className="h-8 w-8 mx-auto text-muted-foreground/60" />
            <p className="font-medium text-sm">No vouchers registered yet</p>
            <p className="text-xs">Create a new voucher to enable buyer flat discounts.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-muted/40 border-b border-border/80 text-muted-foreground font-semibold">
                  <th className="p-4 pl-6">Code</th>
                  <th className="p-4">Discount</th>
                  <th className="p-4">Min. Order</th>
                  <th className="p-4">Remaining</th>
                  <th className="p-4">Expiry Date</th>
                  <th className="p-4 pr-6">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {vouchers.map((v) => {
                  const expired = isExpired(v.expiresAt);
                  const outOfUsage = v.remainingUsage <= 0;
                  return (
                    <tr key={v.id} className="hover:bg-muted/20 transition-colors">
                      <td className="p-4 pl-6 font-mono font-bold text-foreground">{v.code}</td>
                      <td className="p-4 font-semibold text-emerald-600">
                        {formatCurrency(v.discountAmount)}
                      </td>
                      <td className="p-4 text-muted-foreground">
                        {v.minOrderAmount > 0 ? formatCurrency(v.minOrderAmount) : 'No Minimum'}
                      </td>
                      <td className="p-4 font-semibold text-foreground">{v.remainingUsage} uses</td>
                      <td className="p-4 text-muted-foreground text-xs">
                        {formatDiscountDate(v.expiresAt)}
                      </td>
                      <td className="p-4 pr-6">
                        {expired ? (
                          <Badge variant="destructive">Expired</Badge>
                        ) : outOfUsage ? (
                          <Badge variant="secondary">Used Up</Badge>
                        ) : (
                          <Badge className="bg-emerald-100 hover:bg-emerald-100 text-emerald-800 border-emerald-200">
                            Active
                          </Badge>
                        )}
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
