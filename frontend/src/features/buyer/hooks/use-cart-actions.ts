import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { addCartItem, clearCart, getBuyerCart } from '@/lib/api/generated/sdk.gen';
import { getBuyerCartOptions } from '@/lib/api/generated/@tanstack/react-query.gen';
import { useAuth } from '@/lib/auth/context';
import { useNavigate } from '@tanstack/react-router';

export function useCartActions(productId: string | undefined) {
  const auth = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const [conflictOpen, setConflictOpen] = useState(false);
  const [currentStoreName, setCurrentStoreName] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

  const addToCartMutation = useMutation({
    mutationFn: async (vars: { productId: string; quantity: number }) => {
      const { data, error, response } = await addCartItem({
        body: vars,
      });

      if (response && response.status === 409) {
        // Fetch current cart to find out store name for the dialog
        const { data: cartData } = await getBuyerCart();
        throw { status: 409, currentStoreName: (cartData?.storeName as string) || 'another store' };
      }

      if (error) {
        throw new Error(error.error || 'Failed to add item to cart');
      }

      return data;
    },
    onSuccess: () => {
      toast.success(t('catalog.addedToCartSuccess'));
      queryClient.invalidateQueries({ queryKey: getBuyerCartOptions().queryKey });
    },
    onError: (err: unknown) => {
      const errorObj = err as { status?: number; currentStoreName?: string; message?: string };
      if (errorObj.status === 409) {
        setCurrentStoreName(errorObj.currentStoreName || 'another store');
        setConflictOpen(true);
      } else {
        toast.error(errorObj.message || 'An error occurred');
      }
    },
  });

  const clearAndAddMutation = useMutation({
    mutationFn: async () => {
      if (!productId) return;
      const { error: clearErr } = await clearCart();
      if (clearErr) throw new Error(clearErr.error || 'Failed to clear cart');

      const { data, error: addErr } = await addCartItem({
        body: { productId, quantity },
      });
      if (addErr) throw new Error(addErr.error || 'Failed to add item to cart');

      return data;
    },
    onSuccess: () => {
      toast.success(t('catalog.clearedAndAddedSuccess'));
      queryClient.invalidateQueries({ queryKey: getBuyerCartOptions().queryKey });
      setConflictOpen(false);
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const handleAddToCart = () => {
    if (!auth.user) {
      toast.error(t('catalog.signInToAddToCart'));
      navigate({ to: '/login' });
      return;
    }

    if (auth.activeRole !== 'buyer') {
      toast.error(t('catalog.switchToBuyerRole'));
      return;
    }

    if (!productId) return;

    addToCartMutation.mutate({ productId, quantity });
  };

  const isAdding = addToCartMutation.isPending || clearAndAddMutation.isPending;

  return {
    conflictOpen,
    setConflictOpen,
    currentStoreName,
    quantity,
    setQuantity,
    handleAddToCart,
    isAdding,
    clearAndAddMutation,
  };
}
