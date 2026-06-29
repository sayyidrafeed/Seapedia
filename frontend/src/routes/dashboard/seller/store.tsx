import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { updateCurrentSellerStore } from '@/lib/api/generated';
import { getCurrentSellerStoreOptions } from '@/lib/api/generated/@tanstack/react-query.gen';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export const Route = createFileRoute('/dashboard/seller/store')({
  component: SellerStoreManagement,
});

function SellerStoreManagement() {
  const queryClient = useQueryClient();

  const { data: store, isLoading } = useQuery({
    ...getCurrentSellerStoreOptions(),
  });

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMap, setErrorMap] = useState<string | null>(null);

  useEffect(() => {
    if (store) {
      setName(store.name || '');
      setDescription((store.description as string) || '');
    }
  }, [store]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.length < 3) {
      setErrorMap('Store name must be at least 3 characters');
      return;
    }

    setIsSubmitting(true);
    setErrorMap(null);
    try {
      const { error } = await updateCurrentSellerStore({
        body: { name, description },
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
    } finally {
      setIsSubmitting(false);
    }
  };

  const isDirty = name !== store?.name || description !== (store?.description || '');

  if (isLoading) {
    return <div>Loading store profile...</div>;
  }

  return (
    <div className="max-w-2xl bg-card border border-border p-8 rounded-xl shadow-sm">
      <h2 className="text-xl font-bold mb-6">Store Profile</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-medium">
            Store Name *
          </label>
          <input
            id="name"
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            required
            minLength={3}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="description" className="text-sm font-medium">
            Store Description
          </label>
          <textarea
            id="description"
            name="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>

        <button
          type="submit"
          disabled={!isDirty || isSubmitting || name.length < 3}
          className="bg-primary text-primary-foreground h-10 px-4 py-2 inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors disabled:opacity-50 hover:bg-primary/90"
        >
          {isSubmitting ? 'Saving...' : 'Save Changes'}
        </button>

        {errorMap && <p className="text-[0.8rem] font-medium text-destructive mt-2">{errorMap}</p>}
      </form>
    </div>
  );
}
