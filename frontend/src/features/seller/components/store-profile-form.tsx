import { updateCurrentSellerStore } from '@/lib/api/generated';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useForm } from '@tanstack/react-form';
import { zUpdateCurrentSellerStoreBody } from '@/lib/api/generated/zod.gen';
import { useState } from 'react';
import { z } from 'zod';

interface StoreProfileFormProps {
  store: {
    name: string;
    description: unknown;
  };
}

export function StoreProfileForm({ store }: StoreProfileFormProps) {
  const queryClient = useQueryClient();
  const [errorMap, setErrorMap] = useState<string | null>(null);

  const form = useForm({
    defaultValues: {
      name: store.name,
      description: (store.description as string) || undefined,
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
          setErrorMap('This store name is already taken. Please choose another.');
        } else {
          toast.error(err.error || 'Failed to update store');
        }
        return;
      }

      toast.success('Store updated successfully!');
      await queryClient.invalidateQueries({ queryKey: ['getCurrentSellerStore'] });
    },
  });

  return (
    <div className="max-w-2xl bg-card border border-border p-8 rounded-xl shadow-sm">
      <h2 className="text-xl font-bold mb-6">Store Profile</h2>

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
                Store Name *
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
                Store Description
              </label>
              <textarea
                id={field.name}
                name={field.name}
                value={field.state.value || ''}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
              disabled={!isDirty || !canSubmit || isSubmitting}
              className="bg-primary text-primary-foreground h-10 px-4 py-2 inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors disabled:opacity-50 hover:bg-primary/90"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          )}
        />

        {errorMap && <p className="text-[0.8rem] font-medium text-destructive mt-2">{errorMap}</p>}
      </form>
    </div>
  );
}
