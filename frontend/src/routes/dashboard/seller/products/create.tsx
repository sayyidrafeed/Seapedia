import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { listSellerProductsQueryKey } from '@/lib/api/generated/@tanstack/react-query.gen';
import { createSellerProduct } from '@/lib/api/generated';
import { ProductForm } from '@/components/products/product-form';
import type { ProductFormValues } from '@/components/products/product-form';
import { toast } from 'sonner';

export const Route = createFileRoute('/dashboard/seller/products/create')({
  component: CreateProductPage,
});

function CreateProductPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

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
        throw new Error((error as { error?: string }).error || 'Failed to create product');
      }
      return data;
    },
    onSuccess: () => {
      toast.success('Product created successfully!');
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
        <h2 className="text-xl font-bold text-foreground">Add New Product</h2>
        <p className="text-sm text-muted-foreground">List a new product under your store.</p>
      </div>

      <ProductForm
        onSubmit={async (values) => {
          await createMutation.mutateAsync(values);
        }}
        isLoading={createMutation.isPending}
        submitLabel="Create Product"
      />
    </div>
  );
}
