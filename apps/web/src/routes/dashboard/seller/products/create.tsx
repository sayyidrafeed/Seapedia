import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { listSellerProductsQueryKey } from '@/lib/api/generated/@tanstack/react-query.gen';
import { createSellerProduct, presignProductImage } from '@/lib/api/generated';
import { ProductForm } from '@/components/products/product-form';
import type { ProductFormValues } from '@/components/products/product-form';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { uploadImageToR2, type AllowedMime, type PresignResponse } from '@/lib/upload';

export const Route = createFileRoute('/dashboard/seller/products/create')({
  component: CreateProductPage,
});

function CreateProductPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const createMutation = useMutation({
    mutationFn: async ({
      values,
      imageFile,
    }: {
      values: ProductFormValues;
      imageFile?: File | null;
    }) => {
      let imageKey = values.imageKey || null;

      if (imageFile) {
        const key = await uploadImageToR2(imageFile, async (mimeType: AllowedMime) => {
          const res = await presignProductImage({
            body: { mimeType },
          });
          return res as { data?: PresignResponse; error?: unknown };
        });
        if (key) {
          imageKey = key;
        } else {
          throw new Error('Gagal mengunggah gambar produk');
        }
      }

      const { error, data } = await createSellerProduct({
        body: {
          name: values.name,
          description: values.description || null,
          price: values.price,
          stock: values.stock,
          imageKey: imageKey || null,
        },
      });
      if (error) {
        throw new Error((error as { error?: string }).error || t('seller.products.createFailed'));
      }
      return data;
    },
    onSuccess: () => {
      toast.success(t('seller.products.createSuccess'));
      queryClient.invalidateQueries({ queryKey: listSellerProductsQueryKey() });
      navigate({ to: '/dashboard/seller/products' });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">{t('seller.products.createTitle')}</h2>
        <p className="text-sm text-muted-foreground">{t('seller.products.createDesc')}</p>
      </div>

      <ProductForm
        onSubmit={async (values, imageFile) => {
          await createMutation.mutateAsync({ values, imageFile });
        }}
        isLoading={createMutation.isPending}
        submitLabel={t('seller.products.createSubmitButton')}
      />
    </div>
  );
}
