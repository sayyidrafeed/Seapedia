import { createFileRoute } from '@tanstack/react-router';
import { useBuyerOverview } from '@/features/buyer/hooks/use-buyer-overview';
import { BuyerSummaryGrid } from '@/features/buyer/components/buyer-summary-grid';

export const Route = createFileRoute('/dashboard/buyer/')({
  component: BuyerDashboardIndex,
});

function BuyerDashboardIndex() {
  const { wallet, defaultAddress, addresses, cart, isLoading } = useBuyerOverview();

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
      <BuyerSummaryGrid
        walletBalance={wallet?.balance}
        defaultAddress={defaultAddress}
        totalAddressesCount={addresses?.length || 0}
        cart={cart}
        isLoading={isLoading}
      />
    </div>
  );
}
