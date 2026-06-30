import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getSellerOrderDetailOptions,
  processSellerOrderMutation,
} from '@/lib/api/generated/@tanstack/react-query.gen';
import { toast } from 'sonner';
import type { ProcessSellerOrderError } from '@/lib/api/generated/types.gen';

export function useSellerOrderDetail(orderId: string) {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [note, setNote] = useState('');

  const {
    data: order,
    isLoading,
    error,
  } = useQuery({
    ...getSellerOrderDetailOptions({
      path: { id: orderId },
    }),
    retry: false,
  });

  const processMutation = useMutation({
    ...processSellerOrderMutation(),
    onSuccess: () => {
      toast.success('Order processed successfully!');
      setIsModalOpen(false);
      setNote('');
      queryClient.invalidateQueries({
        queryKey: getSellerOrderDetailOptions({ path: { id: orderId } }).queryKey,
      });
    },
    onError: (err: ProcessSellerOrderError) => {
      const errorObj = err as unknown as { status?: number; message?: string };
      if (errorObj.status === 409) {
        toast.error('Concurrency Conflict: Order status has been updated by another process.');
        setIsModalOpen(false);
        setNote('');
        queryClient.invalidateQueries({
          queryKey: getSellerOrderDetailOptions({ path: { id: orderId } }).queryKey,
        });
      } else {
        toast.error(errorObj.message || 'Failed to process order');
      }
    },
  });

  const handleProcessOrder = () => {
    processMutation.mutate({
      path: { id: orderId },
      body: { note: note.trim() || undefined },
    });
  };

  return {
    order,
    isLoading,
    error,
    isModalOpen,
    note,
    isProcessing: processMutation.isPending,
    setIsModalOpen,
    setNote,
    processOrder: handleProcessOrder,
  };
}
