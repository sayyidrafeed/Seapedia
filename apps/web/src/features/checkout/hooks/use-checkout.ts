import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import {
  getBuyerCartOptions,
  getAddressesOptions,
  getBuyerWalletOptions,
} from '@/lib/api/generated/@tanstack/react-query.gen';
import { checkoutPreview, createOrder } from '@/lib/api/generated';
import type { DeliveryMethod } from '../constants/delivery-options';
import { toast } from 'sonner';

export function useCheckout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('regular');
  const [discountCode, setDiscountCode] = useState<string | null>(null);
  const [discountType, setDiscountType] = useState<string | null>(null);

  const cartQuery = useQuery(getBuyerCartOptions());
  const addressesQuery = useQuery(getAddressesOptions());
  const walletQuery = useQuery(getBuyerWalletOptions());

  const defaultAddress = addressesQuery.data?.find((a) => a.isDefault) || addressesQuery.data?.[0];

  const previewQuery = useQuery({
    queryKey: [
      'checkout-preview',
      deliveryMethod,
      cartQuery.data,
      defaultAddress?.id,
      discountCode,
    ],
    queryFn: async () => {
      if (!cartQuery.data || cartQuery.data.items.length === 0) return null;
      const { data, error } = await checkoutPreview({
        body: {
          deliveryMethod,
          discountCode: discountCode || undefined,
        },
      });
      if (error) {
        throw new Error(error.error || 'Failed to calculate checkout preview');
      }
      return data;
    },
    enabled: !!cartQuery.data && cartQuery.data.items.length > 0 && !!defaultAddress,
  });

  const checkoutMutation = useMutation({
    mutationFn: async () => {
      if (!defaultAddress) {
        throw new Error('Please select a shipping address first');
      }
      const { data, error } = await createOrder({
        body: {
          deliveryMethod,
          addressId: defaultAddress.id,
          discountCode: discountCode || undefined,
        },
      });
      if (error) {
        throw new Error(error.error || 'Checkout failed');
      }
      return data;
    },
    onSuccess: (data) => {
      toast.success('Order successfully created!');
      queryClient.invalidateQueries({ queryKey: getBuyerCartOptions().queryKey });
      queryClient.invalidateQueries({ queryKey: getBuyerWalletOptions().queryKey });
      navigate({
        to: `/dashboard/buyer/orders/${data.id}`,
      });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  // Guard: If cart is empty, redirect back to cart
  useEffect(() => {
    if (cartQuery.data && cartQuery.data.items.length === 0) {
      toast.error('Your cart is empty. Add products before checking out.');
      navigate({ to: '/dashboard/buyer/cart' });
    }
  }, [cartQuery.data, navigate]);

  const isLoading = cartQuery.isLoading || addressesQuery.isLoading || walletQuery.isLoading;

  const handleApplyDiscount = (code: string, _amount: number, type: string) => {
    setDiscountCode(code);
    setDiscountType(type);
  };

  const handleRemoveDiscount = () => {
    setDiscountCode(null);
    setDiscountType(null);
  };

  return {
    cart: cartQuery.data,
    addresses: addressesQuery.data,
    wallet: walletQuery.data,
    preview: previewQuery.data,
    defaultAddress,
    deliveryMethod,
    discountCode,
    discountType,
    isLoading,
    isPreviewLoading: previewQuery.isLoading,
    isSubmitting: checkoutMutation.isPending,
    setDeliveryMethod,
    applyDiscount: handleApplyDiscount,
    removeDiscount: handleRemoveDiscount,
    submitCheckout: () => checkoutMutation.mutate(),
  };
}
