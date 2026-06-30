import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Percent, List } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { formatDiscountDate, isExpired } from '../utils/discount-utils';

interface Promo {
  id: string;
  code: string;
  discountPercent: number;
  maxDiscountAmount: unknown;
  minOrderAmount: number;
  expiresAt: string;
}

interface PromoTableProps {
  promos: Promo[] | undefined;
  isLoading: boolean;
}

export function PromoTable({ promos, isLoading }: PromoTableProps) {
  return (
    <Card className="border border-border/80 shadow-sm overflow-hidden">
      <CardHeader className="bg-muted/30 border-b border-border/80 p-6">
        <CardTitle className="text-xl font-extrabold flex items-center gap-2">
          <Percent className="h-5 w-5 text-primary" /> Active Promos
        </CardTitle>
        <CardDescription>
          Percentage discounts off checkout subtotal with maximum caps.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-12 text-center text-muted-foreground animate-pulse">
            Loading promo campaigns...
          </div>
        ) : !promos || promos.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground space-y-2">
            <List className="h-8 w-8 mx-auto text-muted-foreground/60" />
            <p className="font-medium text-sm">No promos campaigns registered yet</p>
            <p className="text-xs">Create a new promo to enable campaign discounts.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-muted/40 border-b border-border/80 text-muted-foreground font-semibold">
                  <th className="p-4 pl-6">Code</th>
                  <th className="p-4">Discount</th>
                  <th className="p-4">Max Discount</th>
                  <th className="p-4">Min. Order</th>
                  <th className="p-4">Expiry Date</th>
                  <th className="p-4 pr-6">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {promos.map((p) => {
                  const expired = isExpired(p.expiresAt);
                  return (
                    <tr key={p.id} className="hover:bg-muted/20 transition-colors">
                      <td className="p-4 pl-6 font-mono font-bold text-foreground">{p.code}</td>
                      <td className="p-4 font-bold text-primary">{p.discountPercent}% OFF</td>
                      <td className="p-4 text-muted-foreground">
                        {p.maxDiscountAmount
                          ? formatCurrency(p.maxDiscountAmount as number)
                          : 'No Limit'}
                      </td>
                      <td className="p-4 text-muted-foreground">
                        {p.minOrderAmount > 0 ? formatCurrency(p.minOrderAmount) : 'No Minimum'}
                      </td>
                      <td className="p-4 text-muted-foreground text-xs">
                        {formatDiscountDate(p.expiresAt)}
                      </td>
                      <td className="p-4 pr-6">
                        {expired ? (
                          <Badge variant="destructive">Expired</Badge>
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
