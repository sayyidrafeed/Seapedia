import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listSellerOrdersOptions,
  processSellerOrderMutation,
} from '@/lib/api/generated/@tanstack/react-query.gen';
import { toast } from 'sonner';
import type { ProcessSellerOrderError } from '@/lib/api/generated/types.gen';

export function useSellerOrders() {
  const queryClient = useQueryClient();
  const [processingOrderId, setProcessingOrderId] = useState<string | null>(null);

  const {
    data: orders,
    isLoading,
    error,
  } = useQuery({
    ...listSellerOrdersOptions(),
    retry: false,
  });

  const processMutation = useMutation({
    ...processSellerOrderMutation(),
    onSuccess: () => {
      toast.success('Order processed successfully!');
      setProcessingOrderId(null);
      queryClient.invalidateQueries({ queryKey: listSellerOrdersOptions().queryKey });
    },
    onError: (err: ProcessSellerOrderError) => {
      const errorObj = err as unknown as { status?: number; message?: string };
      if (errorObj.status === 409) {
        toast.error('This order has already been processed by another process.');
      } else {
        toast.error(errorObj.message || 'Failed to process order');
      }
      setProcessingOrderId(null);
      queryClient.invalidateQueries({ queryKey: listSellerOrdersOptions().queryKey });
    },
  });

  const handleConfirmProcess = () => {
    if (processingOrderId) {
      processMutation.mutate({
        path: { id: processingOrderId },
        body: {},
      });
    }
  };

  return {
    orders,
    isLoading,
    error,
    processingOrderId,
    isProcessing: processMutation.isPending,
    setProcessingOrderId,
    confirmProcess: handleConfirmProcess,
  };
}
