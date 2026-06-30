import { createFileRoute, Link } from '@tanstack/react-router';
import { useCheckout } from '@/features/checkout/hooks/use-checkout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DiscountCodeInput } from '@/components/orders/discount-code-input';
import { CheckoutShippingSection } from '@/features/checkout/components/checkout-shipping-section';
import { CheckoutDeliveryPicker } from '@/features/checkout/components/checkout-delivery-picker';
import { CheckoutItemsSection } from '@/features/checkout/components/checkout-items-section';
import { CheckoutSidebarSummary } from '@/features/checkout/components/checkout-sidebar-summary';
import { formatCurrency } from '@/lib/utils';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export const Route = createFileRoute('/dashboard/buyer/checkout')({
  component: CheckoutPage,
});

function CheckoutPage() {
  const {
    cart,
    wallet,
    preview,
    defaultAddress,
    deliveryMethod,
    discountCode,
    discountType,
    isLoading,
    isPreviewLoading,
    isSubmitting,
    setDeliveryMethod,
    applyDiscount,
    removeDiscount,
    submitCheckout,
  } = useCheckout();

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
          <CheckoutShippingSection defaultAddress={defaultAddress} />

          {/* Delivery Method Picker */}
          {defaultAddress && (
            <CheckoutDeliveryPicker value={deliveryMethod} onChange={setDeliveryMethod} />
          )}

          {/* Discount Section */}
          {defaultAddress && (
            <Card className="border border-border/80 shadow-sm overflow-hidden hover:border-primary/20 transition duration-200">
              <CardContent className="p-6">
                <DiscountCodeInput
                  subtotal={cart.subtotal}
                  appliedCode={discountCode}
                  appliedType={discountType}
                  appliedAmount={preview?.discountAmount || null}
                  onApply={(code, amount, type) => {
                    applyDiscount(code, amount, type);
                    toast.success(
                      `Discount code ${code} applied successfully! Saved ${formatCurrency(amount)}`,
                    );
                  }}
                  onRemove={() => {
                    removeDiscount();
                    toast.info('Discount code removed');
                  }}
                />
              </CardContent>
            </Card>
          )}

          {/* Items Summary */}
          <CheckoutItemsSection items={cart.items} />
        </div>

        {/* Sidebar Summary & Payment */}
        <div className="space-y-6">
          <CheckoutSidebarSummary
            walletBalance={wallet?.balance || 0}
            preview={preview}
            deliveryMethod={deliveryMethod}
            hasNoAddress={!defaultAddress}
            isPreviewLoading={isPreviewLoading}
            isSubmitting={isSubmitting}
            onSubmit={submitCheckout}
          />
        </div>
      </div>
    </div>
  );
}
