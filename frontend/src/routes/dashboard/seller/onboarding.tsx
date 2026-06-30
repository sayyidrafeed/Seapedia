import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { createStore } from '@/lib/api/generated';
import { useQueryClient } from '@tanstack/react-query';
import { getCurrentSellerStoreQueryKey } from '@/lib/api/generated/@tanstack/react-query.gen';
import { toast } from 'sonner';
import { useForm } from '@tanstack/react-form';
import { zCreateStoreBody } from '@/lib/api/generated/zod.gen';
import { useState, useRef } from 'react';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';

export const Route = createFileRoute('/dashboard/seller/onboarding')({
  component: SellerOnboarding,
});

function SellerOnboarding() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [errorMap, setErrorMap] = useState<string | null>(null);
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
      setErrorMap(null);
      try {
        const { error } = await createStore({
          body: value,
        });

        if (error) {
          const err = error as { error?: string };
          if (err.error === 'Store name is already used') {
            setErrorMap(t('seller.store.nameTaken'));
          } else {
            toast.error(t('seller.store.createStoreFailed'));
          }
          return;
        }

        toast.success(t('seller.store.createStoreSuccess'));
        await queryClient.invalidateQueries({ queryKey: getCurrentSellerStoreQueryKey() });
        navigate({ to: '/dashboard/seller' });
      } finally {
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
              disabled={!canSubmit || isSubmitting}
              className="w-full bg-primary text-primary-foreground h-10 px-4 py-2 inline-flex items-center justify-center rounded-md text-sm font-medium disabled:opacity-50 hover:bg-primary/90"
            >
              {isSubmitting ? t('seller.store.creating') : t('seller.store.createButton')}
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
