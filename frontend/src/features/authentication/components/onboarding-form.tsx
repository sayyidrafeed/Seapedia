import { Button } from '@/components/ui/button';

interface OnboardingFormProps {
  selectedRoles: string[];
  isSubmitting: boolean;
  error: string | null;
  onToggleRole: (role: string) => void;
  onSubmit: () => void;
}

export function OnboardingForm({
  selectedRoles,
  isSubmitting,
  error,
  onToggleRole,
  onSubmit,
}: OnboardingFormProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3 bg-destructive-subtle text-destructive text-xs font-medium rounded-md border border-destructive-subtle">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 rounded-md border border-border bg-muted/40 cursor-not-allowed opacity-80">
            <input
              type="checkbox"
              id="role-buyer"
              checked
              disabled
              className="mt-1 h-4 w-4 rounded border-input text-primary focus:ring-primary"
            />
            <label htmlFor="role-buyer" className="select-none">
              <span className="block text-sm font-semibold text-foreground">Buyer (Mandatory)</span>
              <span className="block text-xs text-muted-foreground">
                You are automatically registered as a Buyer. Shop products, add items to cart, top
                up your wallet, and manage checkout.
              </span>
            </label>
          </div>

          <div
            onClick={() => onToggleRole('seller')}
            className={`flex items-start gap-3 p-4 rounded-md border transition-all cursor-pointer ${
              selectedRoles.includes('seller')
                ? 'border-primary bg-primary-subtle/30'
                : 'border-border bg-background hover:bg-muted'
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
                Do you want to sell products? Build your unique store, manage inventory, and process
                incoming orders.
              </span>
            </label>
          </div>

          <div
            onClick={() => onToggleRole('driver')}
            className={`flex items-start gap-3 p-4 rounded-md border transition-all cursor-pointer ${
              selectedRoles.includes('driver')
                ? 'border-primary bg-primary-subtle/30'
                : 'border-border bg-background hover:bg-muted'
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
                Want to deliver orders? Receive notifications of deliveries, handle shipping routes,
                and get driver fees.
              </span>
            </label>
          </div>
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full cursor-pointer font-semibold"
        >
          {isSubmitting ? 'Registering roles...' : 'Complete & Continue'}
        </Button>
      </form>
    </div>
  );
}
