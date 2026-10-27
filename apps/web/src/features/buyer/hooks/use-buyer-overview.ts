import { useQuery } from '@tanstack/react-query';
import {
  getBuyerWalletOptions,
  getAddressesOptions,
  getBuyerCartOptions,
} from '@/lib/api/generated/@tanstack/react-query.gen';

export function useBuyerOverview() {
  const walletQuery = useQuery({
    ...getBuyerWalletOptions(),
    retry: false,
  });

  const addressesQuery = useQuery({
    ...getAddressesOptions(),
    retry: false,
  });

  const cartQuery = useQuery({
    ...getBuyerCartOptions(),
    retry: false,
  });

  const defaultAddress = addressesQuery.data?.find((a) => a.isDefault);
  const cartItemCount = cartQuery.data?.totalItems || 0;

  return {
    wallet: walletQuery.data,
    addresses: addressesQuery.data,
    cart: cartQuery.data,
    defaultAddress,
    cartItemCount,
    isLoading: walletQuery.isLoading || addressesQuery.isLoading || cartQuery.isLoading,
  };
}
