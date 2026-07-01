import type { AddressResponse, CreateAddressData } from './generated';

export interface LocationItem {
  id: string;
  name: string;
}

export function getAddressDefaultValues(
  initialData: AddressResponse | null,
): CreateAddressData['body'] {
  return {
    label: initialData?.label || '',
    recipientName: initialData?.recipientName || '',
    phoneNumber: initialData?.phoneNumber || '',
    province: '', // resolved dynamically in AddressForm
    city: '', // resolved dynamically in AddressForm
    district: '', // resolved dynamically in AddressForm
    postalCode: initialData?.postalCode || '',
    fullAddress: initialData?.fullAddress || '',
    isDefault: initialData?.isDefault || false,
  };
}
