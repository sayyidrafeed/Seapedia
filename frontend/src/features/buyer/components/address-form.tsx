import { useForm } from '@tanstack/react-form';
import { zCreateAddressBody } from '@/lib/api/generated/zod.gen';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { AddressResponse, CreateAddressData } from '@/lib/api/generated';

interface AddressFormProps {
  initialData: AddressResponse | null;
  onSubmit: (values: CreateAddressData['body']) => void;
  isPending: boolean;
}

interface FieldState {
  state: {
    value: string;
    meta: {
      errors?: unknown[];
    };
  };
  handleBlur: () => void;
  handleChange: (val: string) => void;
}

interface FormFieldProps {
  label: string;
  placeholder?: string;
  field: FieldState;
  isTextArea?: boolean;
}

function FormField({ label, placeholder, field, isTextArea = false }: FormFieldProps) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
        {label}
      </label>
      {isTextArea ? (
        <Textarea
          placeholder={placeholder}
          value={field.state.value}
          onBlur={field.handleBlur}
          onChange={(e) => field.handleChange(e.target.value)}
        />
      ) : (
        <Input
          placeholder={placeholder}
          value={field.state.value}
          onBlur={field.handleBlur}
          onChange={(e) => field.handleChange(e.target.value)}
        />
      )}
      {field.state.meta.errors && (
        <p className="text-xs text-red-500 mt-1">
          {field.state.meta.errors
            .map((err) =>
              typeof err === 'object' && err !== null && 'message' in err
                ? (err as { message: string }).message
                : String(err),
            )
            .join(', ')}
        </p>
      )}
    </div>
  );
}

export function AddressForm({ initialData, onSubmit, isPending }: AddressFormProps) {
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
        <form.Field
          name="label"
          children={(field) => (
            <FormField
              label="Label Alamat (Contoh: Rumah, Kantor)"
              placeholder="Rumah / Kantor"
              field={field}
            />
          )}
        />
        <form.Field
          name="recipientName"
          children={(field) => (
            <FormField label="Nama Penerima" placeholder="Nama Lengkap" field={field} />
          )}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <form.Field
          name="phoneNumber"
          children={(field) => (
            <FormField label="Nomor Telepon" placeholder="Contoh: 0812xxxxxxxx" field={field} />
          )}
        />
        <form.Field
          name="postalCode"
          children={(field) => (
            <FormField label="Kode Pos" placeholder="5 digit angka" field={field} />
          )}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <form.Field
          name="province"
          children={(field) => (
            <FormField label="Provinsi" placeholder="Contoh: Jawa Barat" field={field} />
          )}
        />
        <form.Field
          name="city"
          children={(field) => (
            <FormField label="Kota / Kabupaten" placeholder="Contoh: Depok" field={field} />
          )}
        />
        <form.Field
          name="district"
          children={(field) => (
            <FormField label="Kecamatan" placeholder="Contoh: Beji" field={field} />
          )}
        />
      </div>

      <form.Field
        name="fullAddress"
        children={(field) => (
          <FormField
            label="Alamat Lengkap (Jalan, No. Rumah, RT/RW, dsb)"
            placeholder="Tulis alamat lengkap Anda..."
            field={field}
            isTextArea
          />
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
                className="text-sm font-semibold text-foreground cursor-pointer select-none"
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
