import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth/context';
import { onboardUser } from '@/lib/api/generated/sdk.gen';

export const Route = createFileRoute('/onboard')({
  component: OnboardPage,
});

function OnboardPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [selectedRoles, setSelectedRoles] = useState<string[]>(['buyer']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If not logged in, redirect to login
    if (!auth.isLoading && !auth.user) {
      navigate({ to: '/login' });
    }
    // If already onboarded, redirect to home
    if (!auth.isLoading && auth.user && auth.user.isOnboarded) {
      navigate({ to: '/' });
    }
  }, [auth.isLoading, auth.user, navigate]);

  const handleToggleRole = (role: string) => {
    if (role === 'buyer') return; // Buyer is mandatory
    if (selectedRoles.includes(role)) {
      setSelectedRoles(selectedRoles.filter((r) => r !== role));
    } else {
      setSelectedRoles([...selectedRoles, role]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await onboardUser({
        body: {
          roles: selectedRoles as ('buyer' | 'seller' | 'driver')[],
        },
        throwOnError: true,
      });
      await auth.refetchSession();
      navigate({ to: '/' });
    } catch (err) {
      const msg =
        err && typeof err === 'object' && 'message' in err && typeof err.message === 'string'
          ? err.message
          : 'Failed to complete onboarding';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (auth.isLoading) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <span className="animate-pulse text-muted-foreground text-sm font-medium">
          Loading onboarding...
        </span>
      </div>
    );
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12 bg-background">
      <div className="w-full max-w-lg space-y-8 bg-card p-8 rounded-lg border border-border shadow-sm">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground">
            Welcome to Seapedia, {(auth.user?.name as string) || auth.user?.username}!
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Let's customize your profile. Select what roles you want to have in this application.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-destructive/10 text-destructive text-xs font-medium rounded border border-destructive/20">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 rounded-md border border-border bg-accent/20 cursor-not-allowed opacity-80">
              <input
                type="checkbox"
                id="role-buyer"
                checked
                disabled
                className="mt-1 h-4 w-4 rounded border-input text-primary focus:ring-primary"
              />
              <label htmlFor="role-buyer" className="select-none">
                <span className="block text-sm font-semibold text-foreground">
                  Buyer (Mandatory)
                </span>
                <span className="block text-xs text-muted-foreground">
                  You are automatically registered as a Buyer. Shop products, add items to cart, top
                  up your wallet, and manage checkout.
                </span>
              </label>
            </div>

            <div
              onClick={() => handleToggleRole('seller')}
              className={`flex items-start gap-3 p-4 rounded-md border transition-all cursor-pointer ${
                selectedRoles.includes('seller')
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-background hover:bg-accent/50'
              }`}
            >
              <input
                type="checkbox"
                id="role-seller"
                checked={selectedRoles.includes('seller')}
                onChange={() => {}} // Click is handled by parent div
                className="mt-1 h-4 w-4 rounded border-input text-primary focus:ring-primary"
              />
              <label htmlFor="role-seller" className="select-none cursor-pointer">
                <span className="block text-sm font-semibold text-foreground">Seller</span>
                <span className="block text-xs text-muted-foreground">
                  Do you want to sell products? Build your unique store, manage inventory, and
                  process incoming orders.
                </span>
              </label>
            </div>

            <div
              onClick={() => handleToggleRole('driver')}
              className={`flex items-start gap-3 p-4 rounded-md border transition-all cursor-pointer ${
                selectedRoles.includes('driver')
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-background hover:bg-accent/50'
              }`}
            >
              <input
                type="checkbox"
                id="role-driver"
                checked={selectedRoles.includes('driver')}
                onChange={() => {}} // Click is handled by parent div
                className="mt-1 h-4 w-4 rounded border-input text-primary focus:ring-primary"
              />
              <label htmlFor="role-driver" className="select-none cursor-pointer">
                <span className="block text-sm font-semibold text-foreground">Driver</span>
                <span className="block text-xs text-muted-foreground">
                  Want to deliver orders? Receive notifications of deliveries, handle shipping
                  routes, and get driver fees.
                </span>
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-semibold text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 transition-colors cursor-pointer"
          >
            {isSubmitting ? 'Registering roles...' : 'Complete & Continue'}
          </button>
        </form>
      </div>
    </div>
  );
}
