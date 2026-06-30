import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAddressesOptions } from '@/lib/api/generated/@tanstack/react-query.gen';
import {
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from '@/lib/api/generated';
import type { AddressResponse, CreateAddressData } from '@/lib/api/generated';
import { toast } from 'sonner';

export function useAddresses() {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [currentAddress, setCurrentAddress] = useState<AddressResponse | null>(null);

  const { data: addresses, isLoading } = useQuery({
    ...getAddressesOptions(),
    retry: false,
  });

  const createAddressMutation = useMutation({
    mutationFn: async (body: CreateAddressData['body']) => {
      const { data, error } = await createAddress({ body });
      if (error) throw new Error(error.error || 'Failed to add address');
      return data;
    },
    onSuccess: () => {
      toast.success('Address added successfully!');
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ['getAddresses'] });
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const updateAddressMutation = useMutation({
    mutationFn: async (vars: { id: string; body: CreateAddressData['body'] }) => {
      const { data, error } = await updateAddress({
        path: { id: vars.id },
        body: vars.body,
      });
      if (error) throw new Error(error.error || 'Failed to update address');
      return data;
    },
    onSuccess: () => {
      toast.success('Address updated successfully!');
      setIsEditing(false);
      setCurrentAddress(null);
      queryClient.invalidateQueries({ queryKey: ['getAddresses'] });
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const deleteAddressMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await deleteAddress({ path: { id } });
      if (error) throw new Error(error.error || 'Failed to delete address');
      return data;
    },
    onSuccess: () => {
      toast.success('Address deleted successfully!');
      queryClient.invalidateQueries({ queryKey: ['getAddresses'] });
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const setDefaultMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await setDefaultAddress({ path: { id } });
      if (error) throw new Error(error.error || 'Failed to set default address');
      return data;
    },
    onSuccess: () => {
      toast.success('Default address updated!');
      queryClient.invalidateQueries({ queryKey: ['getAddresses'] });
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const handleEditClick = (address: AddressResponse) => {
    setCurrentAddress(address);
    setIsEditing(true);
  };

  const handleAddNewClick = () => {
    setCurrentAddress(null);
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setCurrentAddress(null);
  };

  return {
    addresses,
    isLoading,
    isEditing,
    currentAddress,
    isPending: createAddressMutation.isPending || updateAddressMutation.isPending,
    handleEditClick,
    handleAddNewClick,
    cancelEdit,
    addAddress: (body: CreateAddressData['body']) => createAddressMutation.mutate(body),
    editAddress: (id: string, body: CreateAddressData['body']) =>
      updateAddressMutation.mutate({ id, body }),
    deleteAddress: (id: string) => deleteAddressMutation.mutate(id),
    setDefaultAddress: (id: string) => setDefaultMutation.mutate(id),
  };
}
