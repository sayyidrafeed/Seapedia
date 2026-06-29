import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { createStore } from '@/lib/api/generated';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export const Route = createFileRoute('/dashboard/seller/onboarding')({
  component: SellerOnboarding,
});

function SellerOnboarding() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMap, setErrorMap] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.length < 3) {
      setErrorMap('Store name must be at least 3 characters');
      return;
    }

    setIsSubmitting(true);
    setErrorMap(null);
    try {
      const { error } = await createStore({
        body: { name, description },
      });

      if (error) {
        if ((error as any).error === 'Store name is already used') {
          setErrorMap('This store name is already taken. Please choose another.');
        } else {
          toast.error((error as any).error || 'Failed to create store');
        }
        return;
      }

      toast.success('Store created successfully!');
      await queryClient.invalidateQueries({ queryKey: ['getCurrentSellerStore'] });
      navigate({ to: '/dashboard/seller' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-12 bg-card border border-border p-8 rounded-xl shadow-sm">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold">Create Your Store</h2>
        <p className="text-muted-foreground mt-2">
          Your store is your unique identity on Seapedia. Choose a name that stands out!
        </p>
      </div>

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
            placeholder="e.g. Ocean Electronics"
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
            placeholder="Tell buyers about what you sell..."
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting || name.length < 3}
          className="w-full bg-primary text-primary-foreground h-10 px-4 py-2 inline-flex items-center justify-center rounded-md text-sm font-medium disabled:opacity-50 hover:bg-primary/90"
        >
          {isSubmitting ? 'Creating...' : 'Create Store'}
        </button>

        {errorMap && (
          <p className="text-[0.8rem] font-medium text-destructive text-center mt-2">
            {errorMap}
          </p>
        )}
      </form>
    </div>
  );
}
