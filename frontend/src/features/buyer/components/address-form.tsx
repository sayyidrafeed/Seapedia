import { useForm, useStore } from '@tanstack/react-form';
import { zCreateAddressBody } from '@/lib/api/generated/zod.gen';
import { Button } from '@/components/ui/button';
import { FormField, LocationSelect } from './address-form-fields';
import { useProvinces, useCities, useDistricts } from '@/hooks/use-locations';
import { getAddressDefaultValues } from '@/lib/api/locations';
import type { AddressResponse, CreateAddressData } from '@/lib/api/generated';
import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';

interface AddressFormProps {
  initialData: AddressResponse | null;
  onSubmit: (values: CreateAddressData['body']) => void;
  isPending: boolean;
}

export function AddressForm({ initialData, onSubmit, isPending }: AddressFormProps) {
  const { t } = useTranslation();

  const { data: provinces, isLoading: loadingProvinces, isError: errorProvinces } = useProvinces();

  const form = useForm({
    defaultValues: getAddressDefaultValues(initialData),
    validators: { onChange: zCreateAddressBody },
    onSubmit: async ({ value }) => {
      const provinceName = provinces?.find((p) => p.id === value.province)?.name || value.province;
      const cityName = cities?.find((c) => c.id === value.city)?.name || value.city;
      const districtName = districts?.find((d) => d.id === value.district)?.name || value.district;
      onSubmit({
        ...value,
        province: provinceName,
        city: cityName,
        district: districtName,
      });
    },
  });

  const provinceId = useStore(form.store, (state) => state.values.province);
  const cityId = useStore(form.store, (state) => state.values.city);
  const districtId = useStore(form.store, (state) => state.values.district);

  const { data: cities, isLoading: loadingCities, isError: errorCities } = useCities(provinceId);
  const {
    data: districts,
    isLoading: loadingDistricts,
    isError: errorDistricts,
  } = useDistricts(cityId);

  // Resolve Province Name to ID
  useEffect(() => {
    if (initialData?.province && provinces && !provinceId) {
      const match = provinces.find(
        (p) => p.name.toLowerCase() === initialData.province.toLowerCase(),
      );
      if (match) {
        form.setFieldValue('province', match.id);
      }
    }
  }, [initialData?.province, provinces, provinceId]);

  // Resolve City Name to ID
  useEffect(() => {
    if (initialData?.city && cities && provinceId && !cityId) {
      const match = cities.find((c) => c.name.toLowerCase() === initialData.city.toLowerCase());
      if (match) {
        form.setFieldValue('city', match.id);
      }
    }
  }, [initialData?.city, cities, provinceId, cityId]);

  // Resolve District Name to ID
  useEffect(() => {
    if (initialData?.district && districts && cityId && !districtId) {
      const match = districts.find(
        (d) => d.name.toLowerCase() === initialData.district.toLowerCase(),
      );
      if (match) {
        form.setFieldValue('district', match.id);
      }
    }
  }, [initialData?.district, districts, cityId, districtId]);

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
          children={(f) => (
            <FormField
              label={t('buyer.address.label')}
              placeholder={t('buyer.address.labelPlaceholder')}
              field={f}
            />
          )}
        />
        <form.Field
          name="recipientName"
          children={(f) => (
            <FormField
              label={t('buyer.address.recipientName')}
              placeholder={t('buyer.address.recipientPlaceholder')}
              field={f}
            />
          )}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <form.Field
          name="phoneNumber"
          children={(f) => (
            <FormField
              label={t('buyer.address.phoneNumber')}
              placeholder={t('buyer.address.phonePlaceholder')}
              field={f}
            />
          )}
        />
        <form.Field
          name="postalCode"
          children={(f) => (
            <FormField
              label={t('buyer.address.postalCode')}
              placeholder={t('buyer.address.postalPlaceholder')}
              field={f}
            />
          )}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <form.Field
          name="province"
          children={(f) => (
            <LocationSelect
              label={t('buyer.address.province')}
              value={f.state.value}
              onValueChange={(val) => {
                f.handleChange(val);
                form.setFieldValue('city', '');
                form.setFieldValue('district', '');
              }}
              placeholder={t('buyer.address.provincePlaceholder')}
              loadingPlaceholder="Loading provinces..."
              errorPlaceholder="Error loading provinces"
              items={provinces}
              isLoading={loadingProvinces}
              isError={!!errorProvinces}
              disabled={false}
              errors={f.state.meta.errors}
            />
          )}
        />

        <form.Field
          name="city"
          children={(f) => (
            <LocationSelect
              label={t('buyer.address.city')}
              value={f.state.value}
              onValueChange={(val) => {
                f.handleChange(val);
                form.setFieldValue('district', '');
              }}
              placeholder={t('buyer.address.cityPlaceholder')}
              loadingPlaceholder="Loading cities..."
              errorPlaceholder="Error loading cities"
              items={cities}
              isLoading={loadingCities}
              isError={!!errorCities}
              disabled={!provinceId}
              errors={f.state.meta.errors}
            />
          )}
        />

        <form.Field
          name="district"
          children={(f) => (
            <LocationSelect
              label={t('buyer.address.district')}
              value={f.state.value}
              onValueChange={(val) => {
                f.handleChange(val);
              }}
              placeholder={t('buyer.address.districtPlaceholder')}
              loadingPlaceholder="Loading districts..."
              errorPlaceholder="Error loading districts"
              items={districts}
              isLoading={loadingDistricts}
              isError={!!errorDistricts}
              disabled={!cityId}
              errors={f.state.meta.errors}
            />
          )}
        />
      </div>

      <form.Field
        name="fullAddress"
        children={(f) => (
          <FormField
            label={t('buyer.address.fullAddress')}
            placeholder={t('buyer.address.fullAddressPlaceholder')}
            field={f}
            isTextArea
          />
        )}
      />

      <div className="flex items-center gap-3 pt-2">
        <form.Field
          name="isDefault"
          children={(f) => (
            <>
              <input
                type="checkbox"
                id="isDefault"
                checked={f.state.value}
                onChange={(e) => f.handleChange(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-border rounded focus:ring-blue-500"
              />
              <label
                htmlFor="isDefault"
                className="text-sm font-semibold text-foreground cursor-pointer select-none"
              >
                {t('buyer.address.setAsDefault')}
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
        {isPending ? t('buyer.address.saving') : t('buyer.address.saveAddress')}
      </Button>
    </form>
  );
}
