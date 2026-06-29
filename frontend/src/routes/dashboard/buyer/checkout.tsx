import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import {
  getBuyerCartOptions,
  getAddressesOptions,
  getBuyerWalletOptions,
} from '@/lib/api/generated/@tanstack/react-query.gen';
import { checkoutPreview, createOrder } from '@/lib/api/generated';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { OrderPriceSummary } from '@/components/orders/order-price-summary';
import { formatCurrency } from '@/lib/utils';
import { MapPin, Wallet, AlertCircle, ArrowLeft, Truck, Check } from 'lucide-react';
import { toast } from 'sonner';

export const Route = createFileRoute('/dashboard/buyer/checkout')({
  component: CheckoutPage,
});

type DeliveryMethod = 'instant' | 'next_day' | 'regular';

function CheckoutPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('regular');

  // 1. Fetch Cart, Addresses, and Wallet
  const { data: cart, isLoading: isCartLoading } = useQuery(getBuyerCartOptions());
  const { data: addresses, isLoading: isAddressesLoading } = useQuery(getAddressesOptions());
  const { data: wallet, isLoading: isWalletLoading } = useQuery(getBuyerWalletOptions());

  const defaultAddress = addresses?.find((a) => a.isDefault) || addresses?.[0];

  const { data: preview, isLoading: isPreviewLoading } = useQuery({
    queryKey: ['checkout-preview', deliveryMethod, cart, defaultAddress?.id],
    queryFn: async () => {
      if (!cart || cart.items.length === 0) return null;
      const { data, error } = await checkoutPreview({
        body: { deliveryMethod },
      });
      if (error) {
        throw new Error(error.error || 'Failed to calculate checkout preview');
      }
      return data;
    },
    enabled: !!cart && cart.items.length > 0 && !!defaultAddress,
  });

  // 3. Confirm Order Mutation
  const checkoutMutation = useMutation({
    mutationFn: async () => {
      if (!defaultAddress) {
        throw new Error('Please select a shipping address first');
      }
      const { data, error } = await createOrder({
        body: {
          deliveryMethod,
          addressId: defaultAddress.id,
        },
      });
      if (error) {
        throw new Error(error.error || 'Checkout failed');
      }
      return data;
    },
    onSuccess: (data) => {
      toast.success('Order successfully created!');
      // Invalidate cart and wallet queries
      queryClient.invalidateQueries({ queryKey: getBuyerCartOptions().queryKey });
      queryClient.invalidateQueries({ queryKey: getBuyerWalletOptions().queryKey });
      // Redirect to Order Detail page
      navigate({
        to: `/dashboard/buyer/orders/${data.id}`,
      });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  // Guard: If cart is empty (loaded and has 0 items), redirect back to cart after mount
  useEffect(() => {
    if (cart && cart.items.length === 0) {
      toast.error('Your cart is empty. Add products before checking out.');
      navigate({ to: '/dashboard/buyer/cart' });
    }
  }, [cart, navigate]);

  const isLoading = isCartLoading || isAddressesLoading || isWalletLoading;

  if (isLoading) {
    return (
      <div className="container mx-auto px-6 py-8 max-w-5xl animate-pulse space-y-6">
        <div className="h-10 bg-muted rounded w-1/4" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-40 bg-muted rounded-xl" />
            <div className="h-60 bg-muted rounded-xl" />
          </div>
          <div className="h-80 bg-muted rounded-xl" />
        </div>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return null;
  }

  // Calculate wallet constraint
  const finalTotal = preview?.totalAmount || 0;
  const balance = wallet?.balance || 0;
  const isBalanceInsufficient = balance < finalTotal;
  const hasNoAddress = !defaultAddress;

  const deliveryFeeOptions = [
    {
      value: 'instant' as const,
      label: 'Instant Delivery',
      time: 'Sameday delivery',
      price: 30000,
    },
    {
      value: 'next_day' as const,
      label: 'Next Day Delivery',
      time: 'Arrives tomorrow',
      price: 15000,
    },
    {
      value: 'regular' as const,
      label: 'Regular Delivery',
      time: '2-3 business days',
      price: 10000,
    },
  ];

  return (
    <div className="container mx-auto px-6 py-8 max-w-5xl space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link to="/dashboard/buyer/cart">
          <Button variant="ghost" size="icon" className="rounded-full cursor-pointer">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Checkout</h1>
          <p className="text-sm text-muted-foreground">
            Complete your order summary and confirm payment
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Columns */}
        <div className="lg:col-span-2 space-y-6">
          {/* Shipping Address Section */}
          <Card className="border border-border/80 shadow-sm overflow-hidden hover:border-primary/20 transition duration-200">
            <div className="bg-muted/50 p-4 border-b border-border/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
                  Shipping Address
                </h3>
              </div>
              <Link to="/dashboard/buyer/addresses">
                <Button
                  variant="link"
                  size="sm"
                  className="text-primary hover:underline h-auto p-0 cursor-pointer"
                >
                  {defaultAddress ? 'Change Address' : 'Add Address'}
                </Button>
              </Link>
            </div>
            <CardContent className="p-6">
              {defaultAddress ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-foreground text-base">
                      {defaultAddress.recipientName}
                    </span>
                    <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full font-semibold">
                      {defaultAddress.label}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{defaultAddress.phoneNumber}</p>
                  <p className="text-sm text-foreground leading-relaxed">
                    {defaultAddress.fullAddress}, {defaultAddress.district}, {defaultAddress.city},{' '}
                    {defaultAddress.province} - {defaultAddress.postalCode}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground space-y-3">
                  <AlertCircle className="h-10 w-10 text-destructive animate-pulse" />
                  <p className="text-sm font-medium">No default delivery address found.</p>
                  <p className="text-xs max-w-sm">
                    Please register at least one address before continuing checkout.
                  </p>
                  <Link to="/dashboard/buyer/addresses">
                    <Button size="sm" className="cursor-pointer">
                      Add Shipping Address
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Delivery Method Picker */}
          {defaultAddress && (
            <Card className="border border-border/80 shadow-sm overflow-hidden hover:border-primary/20 transition duration-200">
              <div className="bg-muted/50 p-4 border-b border-border/80">
                <div className="flex items-center gap-2">
                  <Truck className="h-5 w-5 text-primary" />
                  <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
                    Delivery Method
                  </h3>
                </div>
              </div>
              <CardContent className="p-6">
                <RadioGroup
                  value={deliveryMethod}
                  onValueChange={(val) => setDeliveryMethod(val as DeliveryMethod)}
                  className="grid grid-cols-1 md:grid-cols-3 gap-4"
                >
                  {deliveryFeeOptions.map((opt) => (
                    <label
                      key={opt.value}
                      className={`relative flex flex-col p-4 border rounded-xl cursor-pointer transition-all duration-200 hover:border-primary/50 ${
                        deliveryMethod === opt.value
                          ? 'border-primary bg-primary/5 shadow-sm'
                          : 'border-border bg-card'
                      }`}
                    >
                      <RadioGroupItem value={opt.value} className="sr-only" />
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-bold text-sm text-foreground">{opt.label}</span>
                        {deliveryMethod === opt.value && (
                          <span className="bg-primary text-primary-foreground rounded-full p-0.5">
                            <Check className="h-3 w-3" />
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground mb-3">{opt.time}</span>
                      <span className="font-extrabold text-sm text-foreground mt-auto">
                        {formatCurrency(opt.price)}
                      </span>
                    </label>
                  ))}
                </RadioGroup>
              </CardContent>
            </Card>
          )}

          {/* Items Summary (Read-Only) */}
          <Card className="border border-border/80 shadow-sm overflow-hidden hover:border-primary/20 transition duration-200">
            <div className="bg-muted/50 p-4 border-b border-border/80">
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
                Order Items ({cart.items.length})
              </h3>
            </div>
            <CardContent className="p-6 divide-y divide-border/60">
              {cart.items.map((item) => (
                <div
                  key={item.id}
                  className="py-4 first:pt-0 last:pb-0 flex justify-between items-start gap-4"
                >
                  <div className="space-y-1">
                    <h4 className="font-semibold text-sm text-foreground leading-snug">
                      {item.product.name}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(item.product.price)} × {item.quantity}
                    </p>
                  </div>
                  <span className="font-bold text-sm text-foreground whitespace-nowrap">
                    {formatCurrency(item.product.price * item.quantity)}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Summary & Payment */}
        <div className="space-y-6">
          <Card className="border border-border/80 shadow-sm p-6 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-border/60">
              <div className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-primary" />
                <span className="text-sm font-bold text-foreground">Your Balance</span>
              </div>
              <span className="font-black text-foreground">{formatCurrency(balance)}</span>
            </div>

            {isPreviewLoading ? (
              <div className="space-y-4 animate-pulse">
                <div className="h-4 bg-muted rounded w-1/3" />
                <div className="h-20 bg-muted rounded" />
              </div>
            ) : preview ? (
              <OrderPriceSummary
                subtotal={preview.subtotal}
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
              disabled={
                hasNoAddress ||
                isBalanceInsufficient ||
                checkoutMutation.isPending ||
                isPreviewLoading
              }
              onClick={() => checkoutMutation.mutate()}
            >
              {checkoutMutation.isPending ? 'Processing Checkout...' : 'Pay & Confirm Order'}
            </Button>

            <p className="text-[10px] text-center text-muted-foreground leading-relaxed">
              By confirming, your wallet will be charged immediately. Purchases are protected by the
              Seapedia Guarantee.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
