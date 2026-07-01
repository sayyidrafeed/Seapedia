import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { updateSellerProduct } from '@/lib/api/generated';
import {
  getSellerProductByIdOptions,
  listSellerProductsQueryKey,
  getSellerProductByIdQueryKey,
} from '@/lib/api/generated/@tanstack/react-query.gen';
import { ProductForm } from '@/components/products/product-form';
import type { ProductFormValues } from '@/components/products/product-form';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export const Route = createFileRoute('/dashboard/seller/products/$productId/edit')({
  component: EditProductPage,
});

function EditProductPage() {
  const { productId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const {
    data: product,
    isLoading,
    error,
  } = useQuery({
    ...getSellerProductByIdOptions({
      path: { id: productId },
    }),
  });

  const updateMutation = useMutation({
    mutationFn: async (values: ProductFormValues) => {
      const { error, data } = await updateSellerProduct({
        path: { id: productId },
        body: {
          name: values.name,
          description: values.description || null,
          price: values.price,
          stock: values.stock,
        },
      });
      if (error) {
        throw new Error((error as { error?: string }).error || t('seller.products.editFailed'));
      }
      return data;
    },
    onSuccess: () => {
      toast.success(t('seller.products.editSuccess'));
      queryClient.invalidateQueries({ queryKey: listSellerProductsQueryKey() });
      queryClient.invalidateQueries({
        queryKey: getSellerProductByIdQueryKey({ path: { id: productId } }),
      });
      navigate({ to: '/dashboard/seller/products' });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[30vh] items-center justify-center">
        <span className="animate-pulse text-muted-foreground text-sm font-medium">
          {t('seller.products.editLoading')}
        </span>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg p-4">
        {t('seller.products.editNotFound')}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">{t('seller.products.editTitle')}</h2>
        <p className="text-sm text-muted-foreground">{t('seller.products.editDesc')}</p>
      </div>

      <ProductForm
        initialValues={{
          name: product.name,
          description: (product.description as string) || undefined,
          price: product.price,
          stock: product.stock,
        }}
        onSubmit={async (values) => {
          await updateMutation.mutateAsync(values);
        }}
        isLoading={updateMutation.isPending}
        submitLabel={t('seller.store.saveButton')}
      />
    </div>
  );
}
