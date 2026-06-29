import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import {
  getBuyerWalletOptions,
  getAddressesOptions,
  getBuyerCartOptions,
} from '@/lib/api/generated/@tanstack/react-query.gen';
import { Wallet, MapPin, ArrowRight, Plus, ShoppingCart } from 'lucide-react';

export const Route = createFileRoute('/dashboard/buyer/')({
  component: BuyerDashboardIndex,
});

function BuyerDashboardIndex() {
  const { data: wallet, isLoading: isWalletLoading } = useQuery({
    ...getBuyerWalletOptions(),
    retry: false,
  });

  const { data: addresses, isLoading: isAddressesLoading } = useQuery({
    ...getAddressesOptions(),
    retry: false,
  });

  const { data: cart, isLoading: isCartLoading } = useQuery({
    ...getBuyerCartOptions(),
    retry: false,
  });

  const balanceFormatted = wallet
    ? new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
      }).format(wallet.balance)
    : 'Rp 0';

  const defaultAddress = addresses?.find((a) => a.isDefault);
  const cartItemCount = cart?.totalItems || 0;

  return (
    <div className="space-y-6">
      {/* Welcome Card */}
      <div className="bg-gradient-to-r from-blue-600/10 via-purple-600/5 to-transparent border border-blue-500/10 p-8 rounded-2xl shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -z-10" />
        <h2 className="text-2xl font-bold text-foreground mb-2">Welcome to your Buyer Dashboard</h2>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Here you can check your balance, simulate a top-up, manage your shipping addresses, view
          your cart, and prepare for checkout.
        </p>
      </div>

      {/* Grid Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Wallet Balance Card */}
        <div className="bg-card border border-border p-6 rounded-xl shadow-sm flex flex-col justify-between group hover:border-blue-500/20 transition-all duration-300">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Wallet Balance
              </span>
              <div className="text-3xl font-extrabold text-foreground tracking-tight mt-1">
                {isWalletLoading ? (
                  <span className="h-8 w-32 bg-muted animate-pulse block rounded" />
                ) : (
                  balanceFormatted
                )}
              </div>
            </div>
            <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl">
              <Wallet className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-8 border-t border-border/50 pt-4 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Simulate instant virtual top-up</span>
            <Link
              to="/dashboard/buyer/wallet"
              className="text-sm font-semibold text-blue-500 hover:text-blue-600 flex items-center gap-1 group-hover:gap-2 transition-all"
            >
              Top Up Now <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Default Shipping Address Card */}
        <div className="bg-card border border-border p-6 rounded-xl shadow-sm flex flex-col justify-between group hover:border-purple-500/20 transition-all duration-300">
          <div className="flex items-start justify-between">
            <div className="space-y-1 w-full max-w-[80%]">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Default Address
              </span>
              {isAddressesLoading ? (
                <div className="space-y-2 mt-2">
                  <span className="h-4 w-24 bg-muted animate-pulse block rounded" />
                  <span className="h-4 w-full bg-muted animate-pulse block rounded" />
                </div>
              ) : defaultAddress ? (
                <div className="mt-1">
                  <div className="font-bold text-foreground text-sm flex items-center gap-1.5">
                    {defaultAddress.recipientName}
                    <span className="text-[10px] px-1.5 py-0.5 bg-purple-500/10 text-purple-600 rounded font-medium">
                      {defaultAddress.label}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-1">
                    {defaultAddress.fullAddress}, {defaultAddress.district}, {defaultAddress.city},{' '}
                    {defaultAddress.province} - {defaultAddress.postalCode}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground mt-2">
                  No default delivery address set yet.
                </p>
              )}
            </div>
            <div className="p-3 bg-purple-500/10 text-purple-500 rounded-xl">
              <MapPin className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-8 border-t border-border/50 pt-4 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {addresses?.length || 0} saved addresses
            </span>
            {addresses && addresses.length > 0 ? (
              <Link
                to="/dashboard/buyer/addresses"
                className="text-sm font-semibold text-purple-500 hover:text-purple-600 flex items-center gap-1 group-hover:gap-2 transition-all"
              >
                Manage Addresses <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <Link
                to="/dashboard/buyer/addresses"
                className="text-sm font-semibold text-purple-500 hover:text-purple-600 flex items-center gap-1 group"
              >
                Add Address <Plus className="h-4 w-4" />
              </Link>
            )}
          </div>
        </div>

        {/* Shopping Cart Summary Card */}
        <div className="bg-card border border-border p-6 rounded-xl shadow-sm flex flex-col justify-between group hover:border-emerald-500/20 transition-all duration-300">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Active Cart
              </span>
              <div className="text-3xl font-extrabold text-foreground tracking-tight mt-1">
                {isCartLoading ? (
                  <span className="h-8 w-24 bg-muted animate-pulse block rounded" />
                ) : (
                  `${cartItemCount} Items`
                )}
              </div>
              {cart && !!cart.storeName && (
                <p className="text-xs text-muted-foreground mt-1">
                  Shopping from:{' '}
                  <strong className="text-foreground capitalize">{cart.storeName as string}</strong>
                </p>
              )}
            </div>
            <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl">
              <ShoppingCart className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-8 border-t border-border/50 pt-4 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {cart && cart.subtotal
                ? `Subtotal: ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(cart.subtotal)}`
                : 'Cart is empty'}
            </span>
            <Link
              to="/dashboard/buyer/cart"
              className="text-sm font-semibold text-emerald-500 hover:text-emerald-600 flex items-center gap-1 group-hover:gap-2 transition-all"
            >
              View Cart <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
