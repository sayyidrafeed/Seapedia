import { useForm } from '@tanstack/react-form';
import { zCreateSellerProductBody } from '@/lib/api/generated/zod.gen';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

// We base the validation on zCreateSellerProductBody but price and stock are parsed as numbers
const formSchema = zCreateSellerProductBody;

function formatErrors(errors: unknown[]): string {
  return errors
    .map((err) =>
      typeof err === 'object' && err !== null && 'message' in err
        ? (err as { message: string }).message
        : String(err),
    )
    .join(', ');
}

export interface ProductFormValues {
  name: string;
  description?: string;
  price: number;
  stock: number;
}

interface ProductFormProps {
  initialValues?: ProductFormValues;
  onSubmit: (values: ProductFormValues) => Promise<void>;
  isLoading?: boolean;
  submitLabel: string;
}

export function ProductForm({ initialValues, onSubmit, isLoading, submitLabel }: ProductFormProps) {
  const [errorMap, setErrorMap] = useState<string | null>(null);

  const form = useForm({
    defaultValues: {
      name: initialValues?.name ?? '',
      description: initialValues?.description ?? '',
      price: initialValues?.price ?? 0,
      stock: initialValues?.stock ?? 0,
    } as ProductFormValues,
    validators: {
      onChange: formSchema as never,
    },
    onSubmit: async ({ value }) => {
      setErrorMap(null);
      try {
        await onSubmit(value);
      } catch (err: unknown) {
        const error = err as { message?: string };
        setErrorMap(error.message || 'An error occurred during submission.');
      }
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
      className="space-y-6 max-w-2xl bg-card border border-border p-8 rounded-xl shadow-sm"
    >
      <form.Field
        name="name"
        children={(field) => (
          <div className="space-y-2">
            <label htmlFor={field.name} className="text-sm font-medium">
              Product Name *
            </label>
            <Input
              id={field.name}
              name={field.name}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              placeholder="e.g. Premium Sea Sponge"
              required
            />
            {field.state.meta.errors ? (
              <em className="text-xs text-destructive block mt-1">
                {formatErrors(field.state.meta.errors)}
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
              Description
            </label>
            <textarea
              id={field.name}
              name={field.name}
              value={field.state.value || ''}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              placeholder="Provide a detailed description of the product..."
              className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
            {field.state.meta.errors ? (
              <em className="text-xs text-destructive block mt-1">
                {formatErrors(field.state.meta.errors)}
              </em>
            ) : null}
          </div>
        )}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <form.Field
          name="price"
          children={(field) => (
            <div className="space-y-2">
              <label htmlFor={field.name} className="text-sm font-medium">
                Price (IDR) *
              </label>
              <Input
                id={field.name}
                name={field.name}
                type="number"
                min="0"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(Number(e.target.value))}
                placeholder="0"
                required
              />
              {field.state.meta.errors ? (
                <em className="text-xs text-destructive block mt-1">
                  {formatErrors(field.state.meta.errors)}
                </em>
              ) : null}
            </div>
          )}
        />

        <form.Field
          name="stock"
          children={(field) => (
            <div className="space-y-2">
              <label htmlFor={field.name} className="text-sm font-medium">
                Stock Quantity *
              </label>
              <Input
                id={field.name}
                name={field.name}
                type="number"
                min="0"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(Number(e.target.value))}
                placeholder="0"
                required
              />
              {field.state.meta.errors ? (
                <em className="text-xs text-destructive block mt-1">
                  {formatErrors(field.state.meta.errors)}
                </em>
              ) : null}
            </div>
          )}
        />
      </div>

      <form.Subscribe
        selector={(state) => [state.isDirty, state.canSubmit, state.isSubmitting]}
        children={([isDirty, canSubmit, isSubmitting]) => (
          <Button
            type="submit"
            disabled={(!isDirty && !initialValues) || !canSubmit || isSubmitting || isLoading}
            className="w-full md:w-auto"
          >
            {isSubmitting || isLoading ? 'Submitting...' : submitLabel}
          </Button>
        )}
      />

      {errorMap && <p className="text-sm font-medium text-destructive mt-2">{errorMap}</p>}
    </form>
  );
}
