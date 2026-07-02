import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getBuyerWalletOptions,
  getWalletTransactionsOptions,
} from '@/lib/api/generated/@tanstack/react-query.gen';
import { topUpWallet } from '@/lib/api/generated';
import { toast } from 'sonner';

export function useWallet() {
  const queryClient = useQueryClient();
  const [topUpAmount, setTopUpAmount] = useState<number>(50000);
  const [customAmount, setCustomAmount] = useState<string>('');

  const walletQuery = useQuery({
    ...getBuyerWalletOptions(),
    retry: false,
  });

  const transactionsQuery = useQuery({
    ...getWalletTransactionsOptions(),
    retry: false,
  });

  const topUpMutation = useMutation({
    mutationFn: async (amount: number) => {
      const { data, error } = await topUpWallet({
        body: { amount },
      });
      if (error) {
        const errObj = error as Record<string, unknown>;
        const errorMsg =
          (typeof errObj.message === 'string' ? errObj.message : '') ||
          (typeof errObj.error === 'string' ? errObj.error : '') ||
          'Failed to top up wallet';
        throw new Error(errorMsg);
      }
      return data;
    },
    onSuccess: () => {
      toast.success('Wallet topped up successfully!');
      queryClient.invalidateQueries({ queryKey: getBuyerWalletOptions().queryKey });
      queryClient.invalidateQueries({ queryKey: getWalletTransactionsOptions().queryKey });
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const handlePresetSelect = (amount: number) => {
    setTopUpAmount(amount);
    setCustomAmount('');
  };

  const handleCustomAmountChange = (val: string) => {
    setCustomAmount(val);
    const parsed = parseFloat(val);
    if (!isNaN(parsed)) {
      setTopUpAmount(parsed);
    }
  };

  const handleRequestTopUp = () => {
    // If user typed a custom amount, perform strict format checks first
    if (customAmount) {
      const parsedNum = Number(customAmount);

      if (isNaN(parsedNum)) {
        toast.error('Top-up amount must be a valid number');
        return;
      }

      if (!Number.isInteger(parsedNum)) {
        toast.error('Top-up amount must be a whole number (no decimals)');
        return;
      }

      if (parsedNum > 1000000000) {
        toast.error('Maximum top-up amount is Rp 1.000.000.000');
        return;
      }
    } else {
      // Check preset amount
      if (topUpAmount > 1000000000) {
        toast.error('Maximum top-up amount is Rp 1.000.000.000');
        return;
      }
    }

    if (topUpAmount < 10000) {
      toast.error('Minimum top-up amount is Rp 10.000');
      return;
    }

    topUpMutation.mutate(topUpAmount);
  };

  return {
    wallet: walletQuery.data,
    transactions: transactionsQuery.data,
    isWalletLoading: walletQuery.isLoading,
    isTxLoading: transactionsQuery.isLoading,
    topUpAmount,
    customAmount,
    isPending: topUpMutation.isPending,
    handlePresetSelect,
    handleCustomAmountChange,
    handleRequestTopUp,
  };
}
