import { BuyerWalletCard } from './buyer-wallet-card';
import { BuyerAddressCard } from './buyer-address-card';
import { BuyerCartCard } from './buyer-cart-card';

interface Address {
  id: string;
  recipientName: string;
  label: string;
  fullAddress: string;
  district: string;
  city: string;
  province: string;
  postalCode: string;
}

interface Cart {
  totalItems: number;
  subtotal: number;
  storeName?: string | unknown;
}

interface BuyerSummaryGridProps {
  walletBalance: number | undefined;
  defaultAddress: Address | undefined;
  totalAddressesCount: number;
  cart: Cart | undefined;
  isLoading: boolean;
}

export function BuyerSummaryGrid({
  walletBalance,
  defaultAddress,
  totalAddressesCount,
  cart,
  isLoading,
}: BuyerSummaryGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <BuyerWalletCard balance={walletBalance} isLoading={isLoading} />
      <BuyerAddressCard
        defaultAddress={defaultAddress}
        totalAddressesCount={totalAddressesCount}
        isLoading={isLoading}
      />
      <BuyerCartCard cart={cart} isLoading={isLoading} />
    </div>
  );
}
