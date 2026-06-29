import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAddressesOptions } from '@/lib/api/generated/@tanstack/react-query.gen';
import {
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from '@/lib/api/generated';
import type { AddressResponse, CreateAddressData } from '@/lib/api/generated';
import { useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { zCreateAddressBody } from '@/lib/api/generated/zod.gen';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  MapPin,
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  Home,
  Briefcase,
  PlusCircle,
  ArrowLeft,
} from 'lucide-react';

export const Route = createFileRoute('/dashboard/buyer/addresses')({
  component: BuyerAddressesPage,
});

function BuyerAddressesPage() {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [currentAddress, setCurrentAddress] = useState<AddressResponse | null>(null);

  // Queries
  const { data: addresses, isLoading } = useQuery({
    ...getAddressesOptions(),
    retry: false,
  });

  // Mutations
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

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <span className="animate-pulse text-muted-foreground text-sm font-medium">
          Loading addresses...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {isEditing ? (
        <div className="space-y-4">
          <button
            onClick={() => setIsEditing(false)}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground font-semibold"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Addresses
          </button>

          <Card className="border border-border shadow-sm max-w-2xl">
            <CardHeader>
              <CardTitle>
                {currentAddress ? 'Edit Alamat Pengiriman' : 'Tambah Alamat Baru'}
              </CardTitle>
              <CardDescription>
                Provide detailed shipping coordinates for your deliveries.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AddressForm
                initialData={currentAddress}
                onSubmit={(values) => {
                  if (currentAddress) {
                    updateAddressMutation.mutate({
                      id: currentAddress.id,
                      body: values,
                    });
                  } else {
                    createAddressMutation.mutate(values);
                  }
                }}
                isPending={createAddressMutation.isPending || updateAddressMutation.isPending}
              />
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-foreground">Daftar Alamat Pengiriman</h2>
            <Button
              onClick={handleAddNewClick}
              className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
            >
              <Plus className="h-4 w-4" /> Tambah Alamat
            </Button>
          </div>

          {!addresses || addresses.length === 0 ? (
            <div className="border-2 border-dashed border-border rounded-xl p-12 text-center flex flex-col items-center justify-center space-y-4">
              <MapPin className="h-10 w-10 text-muted-foreground/50" />
              <div>
                <p className="font-semibold text-foreground">Belum ada alamat tersimpan</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Add shipping addresses so we can calculate shipping fees during checkout.
                </p>
              </div>
              <Button onClick={handleAddNewClick} variant="outline" className="gap-1.5">
                <PlusCircle className="h-4 w-4" /> Add your first address
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {addresses.map((address) => (
                <Card
                  key={address.id}
                  className={`border relative transition-all duration-300 ${
                    address.isDefault
                      ? 'border-blue-500 shadow-sm bg-blue-500/[0.01]'
                      : 'border-border hover:border-slate-300'
                  }`}
                >
                  {address.isDefault && (
                    <div className="absolute top-4 right-4 bg-blue-500/10 text-blue-600 text-[10px] font-bold py-1 px-2.5 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Utama
                    </div>
                  )}

                  <CardHeader className="pb-3 pr-20">
                    <CardTitle className="text-sm font-extrabold text-muted-foreground uppercase flex items-center gap-1.5">
                      {address.label.toLowerCase() === 'rumah' ? (
                        <Home className="h-3.5 w-3.5 text-blue-500" />
                      ) : address.label.toLowerCase() === 'kantor' ? (
                        <Briefcase className="h-3.5 w-3.5 text-purple-500" />
                      ) : (
                        <MapPin className="h-3.5 w-3.5 text-slate-500" />
                      )}
                      {address.label}
                    </CardTitle>
                    <div className="text-lg font-bold text-foreground mt-2">
                      {address.recipientName}
                    </div>
                    <p className="text-xs text-muted-foreground font-semibold">
                      {address.phoneNumber}
                    </p>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <p className="text-sm text-foreground leading-relaxed">
                      {address.fullAddress}
                      <span className="block text-xs text-muted-foreground mt-1">
                        Kec. {address.district}, {address.city}, Prov. {address.province} -{' '}
                        {address.postalCode}
                      </span>
                    </p>

                    <div className="flex items-center gap-3 pt-3 border-t border-border/50 text-xs">
                      {!address.isDefault && (
                        <button
                          onClick={() => setDefaultMutation.mutate(address.id)}
                          className="font-bold text-blue-500 hover:text-blue-600 mr-auto"
                          disabled={setDefaultMutation.isPending}
                        >
                          Jadikan Utama
                        </button>
                      )}

                      <button
                        onClick={() => handleEditClick(address)}
                        className={`flex items-center gap-1 text-muted-foreground hover:text-foreground font-bold ${
                          address.isDefault ? 'mr-auto' : ''
                        }`}
                      >
                        <Edit className="h-3.5 w-3.5" /> Ubah
                      </button>

                      <button
                        onClick={() => deleteAddressMutation.mutate(address.id)}
                        className="flex items-center gap-1 text-red-500 hover:text-red-600 font-bold"
                        disabled={deleteAddressMutation.isPending}
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Hapus
                      </button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface AddressFormProps {
  initialData: AddressResponse | null;
  onSubmit: (values: CreateAddressData['body']) => void;
  isPending: boolean;
}

function AddressForm({ initialData, onSubmit, isPending }: AddressFormProps) {
  // Use TanStack Form for state management & zod validation
  const form = useForm({
    defaultValues: {
      label: initialData?.label || '',
      recipientName: initialData?.recipientName || '',
      phoneNumber: initialData?.phoneNumber || '',
      province: initialData?.province || '',
      city: initialData?.city || '',
      district: initialData?.district || '',
      postalCode: initialData?.postalCode || '',
      fullAddress: initialData?.fullAddress || '',
      isDefault: initialData?.isDefault || false,
    } as CreateAddressData['body'],
    validators: {
      onChange: zCreateAddressBody,
    },
    onSubmit: async ({ value }) => {
      onSubmit(value);
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
      className="space-y-4"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Label */}
        <form.Field
          name="label"
          children={(field) => (
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Label Alamat (Contoh: Rumah, Kantor)
              </label>
              <Input
                placeholder="Rumah / Kantor"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
              />
              {field.state.meta.errors && (
                <p className="text-xs text-red-500 mt-1">{field.state.meta.errors.join(', ')}</p>
              )}
            </div>
          )}
        />

        {/* Recipient Name */}
        <form.Field
          name="recipientName"
          children={(field) => (
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Nama Penerima
              </label>
              <Input
                placeholder="Nama Lengkap"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
              />
              {field.state.meta.errors && (
                <p className="text-xs text-red-500 mt-1">{field.state.meta.errors.join(', ')}</p>
              )}
            </div>
          )}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Phone Number */}
        <form.Field
          name="phoneNumber"
          children={(field) => (
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Nomor Telepon
              </label>
              <Input
                placeholder="Contoh: 0812xxxxxxxx"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
              />
              {field.state.meta.errors && (
                <p className="text-xs text-red-500 mt-1">{field.state.meta.errors.join(', ')}</p>
              )}
            </div>
          )}
        />

        {/* Postal Code */}
        <form.Field
          name="postalCode"
          children={(field) => (
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Kode Pos
              </label>
              <Input
                placeholder="5 digit angka"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
              />
              {field.state.meta.errors && (
                <p className="text-xs text-red-500 mt-1">{field.state.meta.errors.join(', ')}</p>
              )}
            </div>
          )}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Province */}
        <form.Field
          name="province"
          children={(field) => (
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Provinsi
              </label>
              <Input
                placeholder="Contoh: Jawa Barat"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
              />
              {field.state.meta.errors && (
                <p className="text-xs text-red-500 mt-1">{field.state.meta.errors.join(', ')}</p>
              )}
            </div>
          )}
        />

        {/* City */}
        <form.Field
          name="city"
          children={(field) => (
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Kota / Kabupaten
              </label>
              <Input
                placeholder="Contoh: Depok"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
              />
              {field.state.meta.errors && (
                <p className="text-xs text-red-500 mt-1">{field.state.meta.errors.join(', ')}</p>
              )}
            </div>
          )}
        />

        {/* District */}
        <form.Field
          name="district"
          children={(field) => (
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Kecamatan
              </label>
              <Input
                placeholder="Contoh: Beji"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
              />
              {field.state.meta.errors && (
                <p className="text-xs text-red-500 mt-1">{field.state.meta.errors.join(', ')}</p>
              )}
            </div>
          )}
        />
      </div>

      {/* Full Address */}
      <form.Field
        name="fullAddress"
        children={(field) => (
          <div className="space-y-1">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Alamat Lengkap (Jalan, No. Rumah, RT/RW, dsb)
            </label>
            <textarea
              placeholder="Tulis alamat lengkap Anda..."
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
            />
            {field.state.meta.errors && (
              <p className="text-xs text-red-500 mt-1">{field.state.meta.errors.join(', ')}</p>
            )}
          </div>
        )}
      />

      <div className="flex items-center gap-3 pt-2">
        <form.Field
          name="isDefault"
          children={(field) => (
            <>
              <input
                type="checkbox"
                id="isDefault"
                checked={field.state.value}
                onChange={(e) => field.handleChange(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-border rounded focus:ring-blue-500"
              />
              <label
                htmlFor="isDefault"
                className="text-sm font-semibold text-foreground cursor-pointer"
              >
                Jadikan Alamat Utama
              </label>
            </>
          )}
        />
      </div>

      <Button
        type="submit"
        disabled={isPending}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 font-semibold mt-4"
      >
        {isPending ? 'Saving...' : 'Save Address'}
      </Button>
    </form>
  );
}
