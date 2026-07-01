import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { listSellerProductsQueryKey } from '@/lib/api/generated/@tanstack/react-query.gen';
import { createSellerProduct } from '@/lib/api/generated';
import { ProductForm } from '@/components/products/product-form';
import type { ProductFormValues } from '@/components/products/product-form';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export const Route = createFileRoute('/dashboard/seller/products/create')({
  component: CreateProductPage,
});

function CreateProductPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const createMutation = useMutation({
    mutationFn: async (values: ProductFormValues) => {
      const { error, data } = await createSellerProduct({
        body: {
          name: values.name,
          description: values.description || null,
          price: values.price,
          stock: values.stock,
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
        onSubmit={async (values) => {
          await createMutation.mutateAsync(values);
        }}
        isLoading={createMutation.isPending}
        submitLabel={t('seller.products.createSubmitButton')}
      />
    </div>
  );
}
