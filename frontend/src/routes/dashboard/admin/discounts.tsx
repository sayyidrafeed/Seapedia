import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import {
  listVouchersOptions,
  listPromosOptions,
} from '@/lib/api/generated/@tanstack/react-query.gen';
import { createVoucher, createPromo } from '@/lib/api/generated';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import { Ticket, Percent, Plus, List, Loader2 } from 'lucide-react';

export const Route = createFileRoute('/dashboard/admin/discounts')({
  component: AdminDiscountsPage,
});

type ActiveTab = 'vouchers' | 'promos';

function AdminDiscountsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<ActiveTab>('vouchers');
  const [showVoucherForm, setShowVoucherForm] = useState(false);
  const [showPromoForm, setShowPromoForm] = useState(false);

  // Form states for Voucher
  const [vCode, setVCode] = useState('');
  const [vAmount, setVAmount] = useState('');
  const [vMinOrder, setVMinOrder] = useState('');
  const [vExpiry, setVExpiry] = useState('');
  const [vUsage, setVUsage] = useState('');

  // Form states for Promo
  const [pCode, setPCode] = useState('');
  const [pPercent, setPPercent] = useState('');
  const [pMaxDiscount, setPMaxDiscount] = useState('');
  const [pMinOrder, setPMinOrder] = useState('');
  const [pExpiry, setPExpiry] = useState('');

  // 1. Fetch Queries
  const { data: vouchers, isLoading: isVouchersLoading } = useQuery(listVouchersOptions());
  const { data: promos, isLoading: isPromosLoading } = useQuery(listPromosOptions());

  // 2. Mutations
  const createVoucherMutation = useMutation({
    mutationFn: async () => {
      if (!vCode || !vAmount || !vExpiry || !vUsage) {
        throw new Error('Please fill in all required fields');
      }
      const parsedAmount = parseInt(vAmount, 10);
      const parsedMinOrder = vMinOrder ? parseInt(vMinOrder, 10) : 0;
      const parsedUsage = parseInt(vUsage, 10);

      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        throw new Error('Discount amount must be a valid positive number');
      }
      if (isNaN(parsedMinOrder) || parsedMinOrder < 0) {
        throw new Error('Minimum order amount must be a valid non-negative number');
      }
      if (isNaN(parsedUsage) || parsedUsage < 0) {
        throw new Error('Remaining usage must be a valid non-negative number');
      }

      const { data, error } = await createVoucher({
        body: {
          code: vCode.trim().toUpperCase(),
          discountAmount: parsedAmount,
          minOrderAmount: parsedMinOrder,
          expiresAt: new Date(vExpiry).toISOString(),
          remainingUsage: parsedUsage,
        },
      });
      if (error) {
        throw new Error(error.error || 'Failed to create voucher');
      }
      return data;
    },
    onSuccess: () => {
      toast.success('Voucher created successfully!');
      queryClient.invalidateQueries({ queryKey: listVouchersOptions().queryKey });
      setShowVoucherForm(false);
      // Reset form
      setVCode('');
      setVAmount('');
      setVMinOrder('');
      setVExpiry('');
      setVUsage('');
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const createPromoMutation = useMutation({
    mutationFn: async () => {
      if (!pCode || !pPercent || !pExpiry) {
        throw new Error('Please fill in all required fields');
      }
      const parsedPercent = parseInt(pPercent, 10);
      const parsedMaxDiscount = pMaxDiscount ? parseInt(pMaxDiscount, 10) : null;
      const parsedMinOrder = pMinOrder ? parseInt(pMinOrder, 10) : 0;

      if (isNaN(parsedPercent) || parsedPercent < 1 || parsedPercent > 100) {
        throw new Error('Discount percentage must be a number between 1 and 100');
      }
      if (parsedMaxDiscount !== null && (isNaN(parsedMaxDiscount) || parsedMaxDiscount <= 0)) {
        throw new Error('Max discount amount must be a valid positive number');
      }
      if (isNaN(parsedMinOrder) || parsedMinOrder < 0) {
        throw new Error('Minimum order amount must be a valid non-negative number');
      }

      const { data, error } = await createPromo({
        body: {
          code: pCode.trim().toUpperCase(),
          discountPercent: parsedPercent,
          maxDiscountAmount: parsedMaxDiscount,
          minOrderAmount: parsedMinOrder,
          expiresAt: new Date(pExpiry).toISOString(),
        },
      });
      if (error) {
        throw new Error(error.error || 'Failed to create promo campaign');
      }
      return data;
    },
    onSuccess: () => {
      toast.success('Promo campaign created successfully!');
      queryClient.invalidateQueries({ queryKey: listPromosOptions().queryKey });
      setShowPromoForm(false);
      // Reset form
      setPCode('');
      setPPercent('');
      setPMaxDiscount('');
      setPMinOrder('');
      setPExpiry('');
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('id-ID', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  const isExpired = (expiryStr: string) => {
    return new Date(expiryStr) < new Date();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Tabs Bar */}
        <div className="flex bg-muted p-1 rounded-xl w-fit">
          <button
            onClick={() => {
              setActiveTab('vouchers');
              setShowPromoForm(false);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition cursor-pointer border-none ${
              activeTab === 'vouchers'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Ticket className="h-4 w-4" />
            Vouchers
          </button>
          <button
            onClick={() => {
              setActiveTab('promos');
              setShowVoucherForm(false);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition cursor-pointer border-none ${
              activeTab === 'promos'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Percent className="h-4 w-4" />
            Promos
          </button>
        </div>

        {/* Create Buttons */}
        <div>
          {activeTab === 'vouchers' ? (
            <Button
              onClick={() => setShowVoucherForm(!showVoucherForm)}
              className="flex items-center gap-2 rounded-xl font-bold cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              {showVoucherForm ? 'Hide Form' : 'New Voucher'}
            </Button>
          ) : (
            <Button
              onClick={() => setShowPromoForm(!showPromoForm)}
              className="flex items-center gap-2 rounded-xl font-bold cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              {showPromoForm ? 'Hide Form' : 'New Promo'}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Main List Section */}
        <div className="lg:col-span-2 space-y-6">
          {activeTab === 'vouchers' && (
            <Card className="border border-border/80 shadow-sm overflow-hidden">
              <CardHeader className="bg-muted/30 border-b border-border/80 p-6">
                <CardTitle className="text-xl font-extrabold flex items-center gap-2">
                  <Ticket className="h-5 w-5 text-primary" /> Active Vouchers
                </CardTitle>
                <CardDescription>
                  Flat IDR discounts with usage limits for buyer checkouts.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {isVouchersLoading ? (
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
                              <td className="p-4 pl-6 font-mono font-bold text-foreground">
                                {v.code}
                              </td>
                              <td className="p-4 font-semibold text-emerald-600">
                                {formatCurrency(v.discountAmount)}
                              </td>
                              <td className="p-4 text-muted-foreground">
                                {v.minOrderAmount > 0
                                  ? formatCurrency(v.minOrderAmount)
                                  : 'No Minimum'}
                              </td>
                              <td className="p-4 font-semibold text-foreground">
                                {v.remainingUsage} uses
                              </td>
                              <td className="p-4 text-muted-foreground text-xs">
                                {formatDate(v.expiresAt)}
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
          )}

          {activeTab === 'promos' && (
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
                {isPromosLoading ? (
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
                              <td className="p-4 pl-6 font-mono font-bold text-foreground">
                                {p.code}
                              </td>
                              <td className="p-4 font-bold text-primary">
                                {p.discountPercent}% OFF
                              </td>
                              <td className="p-4 text-muted-foreground">
                                {p.maxDiscountAmount
                                  ? formatCurrency(p.maxDiscountAmount as number)
                                  : 'No Limit'}
                              </td>
                              <td className="p-4 text-muted-foreground">
                                {p.minOrderAmount > 0
                                  ? formatCurrency(p.minOrderAmount)
                                  : 'No Minimum'}
                              </td>
                              <td className="p-4 text-muted-foreground text-xs">
                                {formatDate(p.expiresAt)}
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
          )}
        </div>

        {/* Sidebar Form Section */}
        <div className="space-y-6">
          {showVoucherForm && activeTab === 'vouchers' && (
            <Card className="border border-border/80 shadow-sm animate-in slide-in-from-right duration-300">
              <CardHeader className="bg-muted/30 border-b border-border/80">
                <CardTitle className="text-base font-extrabold flex items-center gap-2">
                  <Ticket className="h-4 w-4 text-primary" /> Create New Voucher
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    createVoucherMutation.mutate();
                  }}
                  className="space-y-4"
                >
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-foreground uppercase tracking-wider">
                      Voucher Code *
                    </label>
                    <Input
                      type="text"
                      placeholder="e.g. SAVE20"
                      value={vCode}
                      onChange={(e) => setVCode(e.target.value)}
                      className="font-mono uppercase placeholder:font-sans placeholder:normal-case h-10 border-border"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-foreground uppercase tracking-wider">
                      Discount Value (IDR) *
                    </label>
                    <Input
                      type="number"
                      placeholder="e.g. 20000"
                      value={vAmount}
                      onChange={(e) => setVAmount(e.target.value)}
                      className="h-10 border-border"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-foreground uppercase tracking-wider">
                      Min Order Value (IDR)
                    </label>
                    <Input
                      type="number"
                      placeholder="e.g. 50000 (0 for no limit)"
                      value={vMinOrder}
                      onChange={(e) => setVMinOrder(e.target.value)}
                      className="h-10 border-border"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-foreground uppercase tracking-wider">
                      Max Remaining Usage *
                    </label>
                    <Input
                      type="number"
                      placeholder="e.g. 10"
                      value={vUsage}
                      onChange={(e) => setVUsage(e.target.value)}
                      className="h-10 border-border"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-foreground uppercase tracking-wider">
                      Expiry Date & Time *
                    </label>
                    <Input
                      type="datetime-local"
                      value={vExpiry}
                      onChange={(e) => setVExpiry(e.target.value)}
                      className="h-10 border-border"
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-11 font-bold rounded-xl mt-4 cursor-pointer"
                    disabled={createVoucherMutation.isPending}
                  >
                    {createVoucherMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    Create Voucher
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {showPromoForm && activeTab === 'promos' && (
            <Card className="border border-border/80 shadow-sm animate-in slide-in-from-right duration-300">
              <CardHeader className="bg-muted/30 border-b border-border/80">
                <CardTitle className="text-base font-extrabold flex items-center gap-2">
                  <Percent className="h-4 w-4 text-primary" /> Create New Promo
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    createPromoMutation.mutate();
                  }}
                  className="space-y-4"
                >
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-foreground uppercase tracking-wider">
                      Promo Code *
                    </label>
                    <Input
                      type="text"
                      placeholder="e.g. PROMO15"
                      value={pCode}
                      onChange={(e) => setPCode(e.target.value)}
                      className="font-mono uppercase placeholder:font-sans placeholder:normal-case h-10 border-border"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-foreground uppercase tracking-wider">
                      Discount Percentage (1-100) *
                    </label>
                    <Input
                      type="number"
                      placeholder="e.g. 15"
                      min="1"
                      max="100"
                      value={pPercent}
                      onChange={(e) => setPPercent(e.target.value)}
                      className="h-10 border-border"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-foreground uppercase tracking-wider">
                      Max Discount Cap (IDR)
                    </label>
                    <Input
                      type="number"
                      placeholder="e.g. 30000 (empty for no cap)"
                      value={pMaxDiscount}
                      onChange={(e) => setPMaxDiscount(e.target.value)}
                      className="h-10 border-border"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-foreground uppercase tracking-wider">
                      Min Order Value (IDR)
                    </label>
                    <Input
                      type="number"
                      placeholder="e.g. 30000 (0 for no limit)"
                      value={pMinOrder}
                      onChange={(e) => setPMinOrder(e.target.value)}
                      className="h-10 border-border"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-foreground uppercase tracking-wider">
                      Expiry Date & Time *
                    </label>
                    <Input
                      type="datetime-local"
                      value={pExpiry}
                      onChange={(e) => setPExpiry(e.target.value)}
                      className="h-10 border-border"
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-11 font-bold rounded-xl mt-4 cursor-pointer"
                    disabled={createPromoMutation.isPending}
                  >
                    {createPromoMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    Create Promo
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {!showVoucherForm && activeTab === 'vouchers' && (
            <div className="p-6 border border-dashed rounded-xl flex flex-col items-center justify-center text-center space-y-3 text-muted-foreground">
              <Ticket className="h-8 w-8 text-muted-foreground/60" />
              <p className="text-xs">
                To create a new flat discount voucher, click the button in the top right.
              </p>
            </div>
          )}

          {!showPromoForm && activeTab === 'promos' && (
            <div className="p-6 border border-dashed rounded-xl flex flex-col items-center justify-center text-center space-y-3 text-muted-foreground">
              <Percent className="h-8 w-8 text-muted-foreground/60" />
              <p className="text-xs">
                To launch a new percentage promo campaign, click the button in the top right.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
