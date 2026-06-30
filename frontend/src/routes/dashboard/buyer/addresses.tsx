import { createFileRoute } from '@tanstack/react-router';
import { useAddresses } from '@/features/buyer/hooks/use-addresses';
import { AddressForm } from '@/features/buyer/components/address-form';
import { AddressList } from '@/features/buyer/components/address-list';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, ArrowLeft } from 'lucide-react';

export const Route = createFileRoute('/dashboard/buyer/addresses')({
  component: BuyerAddressesPage,
});

function BuyerAddressesPage() {
  const {
    addresses,
    isLoading,
    isEditing,
    currentAddress,
    isPending,
    handleEditClick,
    handleAddNewClick,
    cancelEdit,
    addAddress,
    editAddress,
    deleteAddress,
    setDefaultAddress,
  } = useAddresses();

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
            onClick={cancelEdit}
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
                    editAddress(currentAddress.id, values);
                  } else {
                    addAddress(values);
                  }
                }}
                isPending={isPending}
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

          <AddressList
            addresses={addresses}
            onEdit={handleEditClick}
            onDelete={deleteAddress}
            onSetDefault={setDefaultAddress}
            onAddNew={handleAddNewClick}
            isActionPending={isPending}
          />
        </div>
      )}
    </div>
  );
}
