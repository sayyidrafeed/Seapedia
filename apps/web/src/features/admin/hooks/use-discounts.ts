import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listVouchersOptions,
  listPromosOptions,
} from '@/lib/api/generated/@tanstack/react-query.gen';
import { createVoucher, createPromo } from '@/lib/api/generated';
import { toast } from 'sonner';

export type ActiveTab = 'vouchers' | 'promos';

export function useDiscounts() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<ActiveTab>('vouchers');
  const [showVoucherForm, setShowVoucherForm] = useState(false);
  const [showPromoForm, setShowPromoForm] = useState(false);

  // Form states for Voucher
  const [vCode, setVCode] = useState('');
  const [vAmount, setVAmount] = useState('');
  const [vMinOrder, setVMinOrder] = useState('');
  const [vExpiry, setVExpiry] = useState('');
  const [vUsage, setVUsage] = useState('');

  // Form states for Promo
  const [pCode, setPCode] = useState('');
  const [pPercent, setPPercent] = useState('');
  const [pMaxDiscount, setPMaxDiscount] = useState('');
  const [pMinOrder, setPMinOrder] = useState('');
  const [pExpiry, setPExpiry] = useState('');

  const vouchersQuery = useQuery(listVouchersOptions());
  const promosQuery = useQuery(listPromosOptions());

  const createVoucherMutation = useMutation({
    mutationFn: async () => {
      if (!vCode || !vAmount || !vExpiry || !vUsage) {
        throw new Error('Please fill in all required fields');
      }
      const parsedAmount = parseInt(vAmount, 10);
      const parsedMinOrder = vMinOrder ? parseInt(vMinOrder, 10) : 0;
      const parsedUsage = parseInt(vUsage, 10);

      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        throw new Error('Discount amount must be a valid positive number');
      }
      if (isNaN(parsedMinOrder) || parsedMinOrder < 0) {
        throw new Error('Minimum order amount must be a valid non-negative number');
      }
      if (isNaN(parsedUsage) || parsedUsage < 0) {
        throw new Error('Remaining usage must be a valid non-negative number');
      }

      const { data, error } = await createVoucher({
        body: {
          code: vCode.trim().toUpperCase(),
          discountAmount: parsedAmount,
          minOrderAmount: parsedMinOrder,
          expiresAt: new Date(vExpiry).toISOString(),
          remainingUsage: parsedUsage,
        },
      });
      if (error) {
        throw new Error(error.error || 'Failed to create voucher');
      }
      return data;
    },
    onSuccess: () => {
      toast.success('Voucher created successfully!');
      queryClient.invalidateQueries({ queryKey: listVouchersOptions().queryKey });
      setShowVoucherForm(false);
      // Reset form
      setVCode('');
      setVAmount('');
      setVMinOrder('');
      setVExpiry('');
      setVUsage('');
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const createPromoMutation = useMutation({
    mutationFn: async () => {
      if (!pCode || !pPercent || !pExpiry) {
        throw new Error('Please fill in all required fields');
      }
      const parsedPercent = parseInt(pPercent, 10);
      const parsedMaxDiscount = pMaxDiscount ? parseInt(pMaxDiscount, 10) : null;
      const parsedMinOrder = pMinOrder ? parseInt(pMinOrder, 10) : 0;

      if (isNaN(parsedPercent) || parsedPercent < 1 || parsedPercent > 100) {
        throw new Error('Discount percentage must be a number between 1 and 100');
      }
      if (parsedMaxDiscount !== null && (isNaN(parsedMaxDiscount) || parsedMaxDiscount <= 0)) {
        throw new Error('Max discount amount must be a valid positive number');
      }
      if (isNaN(parsedMinOrder) || parsedMinOrder < 0) {
        throw new Error('Minimum order amount must be a valid non-negative number');
      }

      const { data, error } = await createPromo({
        body: {
          code: pCode.trim().toUpperCase(),
          discountPercent: parsedPercent,
          maxDiscountAmount: parsedMaxDiscount,
          minOrderAmount: parsedMinOrder,
          expiresAt: new Date(pExpiry).toISOString(),
        },
      });
      if (error) {
        throw new Error(error.error || 'Failed to create promo campaign');
      }
      return data;
    },
    onSuccess: () => {
      toast.success('Promo campaign created successfully!');
      queryClient.invalidateQueries({ queryKey: listPromosOptions().queryKey });
      setShowPromoForm(false);
      // Reset form
      setPCode('');
      setPPercent('');
      setPMaxDiscount('');
      setPMinOrder('');
      setPExpiry('');
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  return {
    activeTab,
    showVoucherForm,
    showPromoForm,
    vouchers: vouchersQuery.data,
    promos: promosQuery.data,
    isVouchersLoading: vouchersQuery.isLoading,
    isPromosLoading: promosQuery.isLoading,
    isVoucherCreating: createVoucherMutation.isPending,
    isPromoCreating: createPromoMutation.isPending,
    vCode,
    vAmount,
    vMinOrder,
    vExpiry,
    vUsage,
    pCode,
    pPercent,
    pMaxDiscount,
    pMinOrder,
    pExpiry,
    setActiveTab,
    setShowVoucherForm,
    setShowPromoForm,
    setVCode,
    setVAmount,
    setVMinOrder,
    setVExpiry,
    setVUsage,
    setPCode,
    setPPercent,
    setPMaxDiscount,
    setPMinOrder,
    setPExpiry,
    createVoucher: () => createVoucherMutation.mutate(),
    createPromo: () => createPromoMutation.mutate(),
  };
}
