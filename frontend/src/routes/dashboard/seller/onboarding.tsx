import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { createStore, presignStoreLogo, updateCurrentSellerStore } from '@/lib/api/generated';
import { useQueryClient } from '@tanstack/react-query';
import { getCurrentSellerStoreQueryKey } from '@/lib/api/generated/@tanstack/react-query.gen';
import { toast } from 'sonner';
import { useForm } from '@tanstack/react-form';
import { zCreateStoreBody } from '@/lib/api/generated/zod.gen';
import { useState, useRef } from 'react';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { ImageUploader } from '@/components/ui/image-uploader';
import { uploadImageToR2, type AllowedMime, type PresignResponse } from '@/lib/upload';

export const Route = createFileRoute('/dashboard/seller/onboarding')({
  component: SellerOnboarding,
});

function SellerOnboarding() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [errorMap, setErrorMap] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);
  const submitLock = useRef(false);
  const { t } = useTranslation();

  const form = useForm({
    defaultValues: {
      name: '',
      description: undefined,
    } as z.infer<typeof zCreateStoreBody>,
    validators: {
      onChange: zCreateStoreBody,
    },
    onSubmit: async ({ value }) => {
      if (submitLock.current) return;
      submitLock.current = true;
      setIsSubmittingManual(true);
      setErrorMap(null);

      const loadingToast = toast.loading('Membuat toko...');

      try {
        const { data: store, error } = await createStore({
          body: value,
        });

        if (error) {
          const err = error as { error?: string };
          if (err.error === 'Store name is already used') {
            setErrorMap(t('seller.store.nameTaken'));
          } else {
            toast.error(t('seller.store.createStoreFailed'));
          }
          toast.dismiss(loadingToast);
          return;
        }

        // If a logo was selected, upload it now
        if (logoFile && store?.id) {
          toast.loading('Mengunggah logo toko...', { id: loadingToast });
          const key = await uploadImageToR2(logoFile, async (mimeType: AllowedMime) => {
            const res = await presignStoreLogo({
              path: { storeId: store.id },
              body: { mimeType },
            });
            return res as { data?: PresignResponse; error?: unknown };
          });

          if (key) {
            const { error: updateError } = await updateCurrentSellerStore({
              body: { logoKey: key },
            });
            if (updateError) {
              toast.error('Gagal menyimpan logo toko, silakan unggah kembali nanti di pengaturan.');
            }
          }
        }

        toast.success(t('seller.store.createStoreSuccess'));
        await queryClient.invalidateQueries({ queryKey: getCurrentSellerStoreQueryKey() });
        navigate({ to: '/dashboard/seller' });
      } catch {
        toast.error('Terjadi kesalahan saat membuat toko');
      } finally {
        toast.dismiss(loadingToast);
        setIsSubmittingManual(false);
        submitLock.current = false;
      }
    },
  });

  return (
    <div className="max-w-xl mx-auto mt-12 bg-card border border-border p-8 rounded-xl shadow-sm">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold">{t('seller.store.onboardingTitle')}</h2>
        <p className="text-muted-foreground mt-2">{t('seller.store.onboardingDesc')}</p>
      </div>

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
            value={logoFile}
            onChange={setLogoFile}
            disabled={isSubmittingManual}
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
                placeholder={t('seller.store.namePlaceholder')}
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
              <textarea
                id={field.name}
                name={field.name}
                value={field.state.value || ''}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder={t('seller.store.descPlaceholder')}
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
          selector={(state) => [state.canSubmit, state.isSubmitting]}
          children={([canSubmit, isSubmitting]) => (
            <button
              type="submit"
              disabled={!canSubmit || isSubmitting || isSubmittingManual}
              className="w-full bg-primary text-primary-foreground h-10 px-4 py-2 inline-flex items-center justify-center rounded-md text-sm font-medium disabled:opacity-50 hover:bg-primary/90"
            >
              {isSubmitting || isSubmittingManual
                ? t('seller.store.creating')
                : t('seller.store.createButton')}
            </button>
          )}
        />

        {errorMap && (
          <p className="text-[0.8rem] font-medium text-destructive text-center mt-2">{errorMap}</p>
        )}
      </form>
    </div>
  );
}
