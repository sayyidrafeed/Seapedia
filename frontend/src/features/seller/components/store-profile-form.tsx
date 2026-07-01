import { updateCurrentSellerStore, presignStoreLogo } from '@/lib/api/generated';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useForm } from '@tanstack/react-form';
import { zUpdateCurrentSellerStoreBody } from '@/lib/api/generated/zod.gen';
import { useState } from 'react';
import { z } from 'zod';
import { Textarea } from '@/components/ui/textarea';
import { useTranslation } from 'react-i18next';
import { ImageUploader } from '@/components/ui/image-uploader';
import { uploadImageToR2, type AllowedMime, type PresignResponse } from '@/lib/upload';

interface StoreProfileFormProps {
  store: {
    id: string;
    name: string;
    description: unknown;
    logoKey?: unknown;
    logoUrl?: unknown;
  };
}

export function StoreProfileForm({ store }: StoreProfileFormProps) {
  const queryClient = useQueryClient();
  const [errorMap, setErrorMap] = useState<string | null>(null);
  const [logoValue, setLogoValue] = useState<File | string | null>(
    (store.logoUrl as string) || null,
  );
  const [isUploading, setIsUploading] = useState(false);
  const { t } = useTranslation();

  const form = useForm({
    defaultValues: {
      name: store.name,
      description: (store.description as string) || undefined,
      logoKey: (store.logoKey as string) || undefined,
    } as z.infer<typeof zUpdateCurrentSellerStoreBody>,
    validators: {
      onChange: zUpdateCurrentSellerStoreBody,
    },
    onSubmit: async ({ value }) => {
      setErrorMap(null);
      const { error } = await updateCurrentSellerStore({
        body: value,
      });

      if (error) {
        const err = error as { error?: string };
        if (err.error === 'Store name is already used') {
          setErrorMap(t('seller.store.nameTaken'));
        } else {
          toast.error(t('seller.store.updateFailed'));
        }
        return;
      }

      toast.success(t('seller.store.updateSuccess'));
      await queryClient.invalidateQueries({ queryKey: ['getCurrentSellerStore'] });
      // Reset form state dirty flag
      form.reset();
    },
  });

  const handleLogoChange = async (file: File | null) => {
    if (!file) {
      setLogoValue(null);
      form.setFieldValue('logoKey', null);
      return;
    }

    setIsUploading(true);
    const loadingToast = toast.loading('Mengunggah logo...');
    try {
      const key = await uploadImageToR2(file, async (mimeType: AllowedMime) => {
        const res = await presignStoreLogo({
          path: { storeId: store.id },
          body: { mimeType },
        });
        return res as { data?: PresignResponse; error?: unknown };
      });

      if (key) {
        form.setFieldValue('logoKey', key);
        setLogoValue(file);
        toast.success('Logo berhasil diunggah (klik Simpan untuk menerapkan)');
      }
    } catch {
      toast.error('Gagal mengunggah logo');
    } finally {
      toast.dismiss(loadingToast);
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-2xl bg-card border border-border p-8 rounded-xl shadow-sm">
      <h2 className="text-xl font-bold mb-6">{t('seller.store.profileTitle')}</h2>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
        className="space-y-6"
      >
        <div className="flex flex-col items-center gap-2 mb-4">
          <label className="text-sm font-medium self-start">Logo Toko</label>
          <ImageUploader
            value={logoValue}
            onChange={handleLogoChange}
            disabled={isUploading || form.state.isSubmitting}
            aspectRatio="square"
            className="w-full max-w-[200px]"
          />
        </div>

        <form.Field
          name="name"
          children={(field) => (
            <div className="space-y-2">
              <label htmlFor={field.name} className="text-sm font-medium">
                {t('seller.store.nameLabel')}
              </label>
              <input
                id={field.name}
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                required
              />
              {field.state.meta.errors ? (
                <em className="text-xs text-destructive block mt-1">
                  {field.state.meta.errors
                    .map((err) =>
                      typeof err === 'object' && err !== null && 'message' in err
                        ? (err as { message: string }).message
                        : String(err),
                    )
                    .join(', ')}
                </em>
              ) : null}
            </div>
          )}
        />

        <form.Field
          name="description"
          children={(field) => (
            <div className="space-y-2">
              <label htmlFor={field.name} className="text-sm font-medium">
                {t('seller.store.descLabel')}
              </label>
              <Textarea
                id={field.name}
                name={field.name}
                value={field.state.value || ''}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
              />
              {field.state.meta.errors ? (
                <em className="text-xs text-destructive block mt-1">
                  {field.state.meta.errors
                    .map((err) =>
                      typeof err === 'object' && err !== null && 'message' in err
                        ? (err as { message: string }).message
                        : String(err),
                    )
                    .join(', ')}
                </em>
              ) : null}
            </div>
          )}
        />

        <form.Subscribe
          selector={(state) => [state.isDirty, state.canSubmit, state.isSubmitting]}
          children={([isDirty, canSubmit, isSubmitting]) => (
            <button
              type="submit"
              disabled={!isDirty || !canSubmit || isSubmitting || isUploading}
              className="bg-primary text-primary-foreground h-10 px-4 py-2 inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors disabled:opacity-50 hover:bg-primary/90"
            >
              {isSubmitting ? t('seller.store.saving') : t('seller.store.saveButton')}
            </button>
          )}
        />

        {errorMap && <p className="text-[0.8rem] font-medium text-destructive mt-2">{errorMap}</p>}
      </form>
    </div>
  );
}
