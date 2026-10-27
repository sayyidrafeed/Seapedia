import { useForm } from '@tanstack/react-form';
import { zCreateSellerProductBody } from '@/lib/api/generated/zod.gen';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { ImageUploader } from '@/components/ui/image-uploader';
import { toast } from 'sonner';

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
  imageKey?: string | null;
}

interface ProductFormProps {
  initialValues?: ProductFormValues;
  initialImageUrl?: string | null;
  onSubmit: (values: ProductFormValues, imageFile?: File | null) => Promise<void>;
  isLoading?: boolean;
  submitLabel: string;
  onUpload?: (file: File) => Promise<string | null>;
}

export function ProductForm({
  initialValues,
  initialImageUrl,
  onSubmit,
  isLoading,
  submitLabel,
  onUpload,
}: ProductFormProps) {
  const [errorMap, setErrorMap] = useState<string | null>(null);
  const [imageValue, setImageValue] = useState<File | string | null>(initialImageUrl || null);
  const [isUploading, setIsUploading] = useState(false);

  const form = useForm({
    defaultValues: {
      name: initialValues?.name ?? '',
      description: initialValues?.description ?? '',
      price: initialValues?.price ?? 0,
      stock: initialValues?.stock ?? 0,
      imageKey: initialValues?.imageKey ?? null,
    } as ProductFormValues,
    validators: {
      onChange: formSchema as never,
    },
    onSubmit: async ({ value }) => {
      setErrorMap(null);
      try {
        const fileToUpload = imageValue instanceof File ? imageValue : null;
        await onSubmit(value, fileToUpload);
      } catch (err: unknown) {
        const error = err as { message?: string };
        setErrorMap(error.message || 'An error occurred during submission.');
      }
    },
  });

  const handleImageChange = async (file: File | null) => {
    if (!file) {
      setImageValue(null);
      form.setFieldValue('imageKey', null);
      return;
    }

    if (onUpload) {
      setIsUploading(true);
      const loadingToast = toast.loading('Mengunggah gambar...');
      try {
        const key = await onUpload(file);
        if (key) {
          form.setFieldValue('imageKey', key);
          setImageValue(file);
          toast.success('Gambar berhasil diunggah (klik Simpan untuk menerapkan)');
        }
      } catch {
        toast.error('Gagal mengunggah gambar');
      } finally {
        toast.dismiss(loadingToast);
        setIsUploading(false);
      }
    } else {
      setImageValue(file);
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
      className="space-y-6 max-w-2xl bg-card border border-border p-8 rounded-xl shadow-sm"
    >
      <div className="space-y-2">
        <label className="text-sm font-medium">Product Image</label>
        <ImageUploader
          value={imageValue}
          onChange={handleImageChange}
          disabled={isUploading || isLoading}
          aspectRatio="square"
          className="w-full max-w-[240px]"
        />
      </div>

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
            disabled={
              (!isDirty && !initialValues && !imageValue) ||
              !canSubmit ||
              isSubmitting ||
              isLoading ||
              isUploading
            }
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
