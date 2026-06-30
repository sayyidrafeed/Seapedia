import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getBuyerWalletOptions,
  getWalletTransactionsOptions,
} from '@/lib/api/generated/@tanstack/react-query.gen';
import { requestTopUp, simulateTopUp } from '@/lib/api/generated';
import { toast } from 'sonner';

export function useWallet() {
  const queryClient = useQueryClient();
  const [topUpAmount, setTopUpAmount] = useState<number>(50000);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [selectedMethod, setSelectedMethod] = useState<string>('BCA_VA');
  const [pendingPayment, setPendingPayment] = useState<{
    transactionId: string;
    amount: number;
    paymentMethod: string;
    virtualAccount: string;
  } | null>(null);

  const walletQuery = useQuery({
    ...getBuyerWalletOptions(),
    retry: false,
  });

  const transactionsQuery = useQuery({
    ...getWalletTransactionsOptions(),
    retry: false,
  });

  const requestTopUpMutation = useMutation({
    mutationFn: async (vars: { amount: number; paymentMethod: string }) => {
      const { data, error } = await requestTopUp({
        body: vars,
      });
      if (error) {
        throw new Error(error.error || 'Failed to create top-up request');
      }
      return data;
    },
    onSuccess: (data) => {
      if (data && data.transaction) {
        setPendingPayment({
          transactionId: data.transaction.id,
          amount: data.transaction.amount,
          paymentMethod: (data.transaction.paymentMethod as string) || selectedMethod,
          virtualAccount: data.paymentInstructions.virtualAccount || '',
        });
        toast.success('Top-up request generated!');
      }
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const simulatePaymentMutation = useMutation({
    mutationFn: async (transactionId: string) => {
      const { data, error } = await simulateTopUp({
        path: { transactionId },
      });
      if (error) {
        throw new Error(error.error || 'Failed to simulate payment');
      }
      return data;
    },
    onSuccess: () => {
      toast.success('Payment simulated successfully! Balance updated.');
      setPendingPayment(null);
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
    const parsed = parseInt(val, 10);
    if (!isNaN(parsed)) {
      setTopUpAmount(parsed);
    }
  };

  const handleRequestTopUp = () => {
    if (topUpAmount < 10000) {
      toast.error('Minimum top-up amount is Rp 10.000');
      return;
    }
    requestTopUpMutation.mutate({
      amount: topUpAmount,
      paymentMethod: selectedMethod,
    });
  };

  const cancelPending = () => {
    setPendingPayment(null);
  };

  return {
    wallet: walletQuery.data,
    transactions: transactionsQuery.data,
    isWalletLoading: walletQuery.isLoading,
    isTxLoading: transactionsQuery.isLoading,
    topUpAmount,
    customAmount,
    selectedMethod,
    pendingPayment,
    isRequesting: requestTopUpMutation.isPending,
    isSimulating: simulatePaymentMutation.isPending,
    setSelectedMethod,
    handlePresetSelect,
    handleCustomAmountChange,
    handleRequestTopUp,
    simulatePayment: () => {
      if (pendingPayment) {
        simulatePaymentMutation.mutate(pendingPayment.transactionId);
      }
    },
    cancelPending,
  };
}
