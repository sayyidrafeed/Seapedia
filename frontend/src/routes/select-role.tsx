import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import { useAuth } from '@/lib/auth/context';

export const Route = createFileRoute('/select-role')({
  component: SelectRolePage,
});

function SelectRolePage() {
  const auth = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!auth.isLoading && !auth.user) {
      navigate({ to: '/login' });
    } else if (!auth.isLoading && auth.roles.length === 1) {
      const singleRole = auth.roles[0];
      auth.selectRole(singleRole as 'admin' | 'seller' | 'buyer' | 'driver').then(() => {
        navigate({ to: `/dashboard/${singleRole}` });
      });
    }
  }, [auth.isLoading, auth.user, auth.roles, navigate]);

  const handleSelect = async (role: 'admin' | 'seller' | 'buyer' | 'driver') => {
    try {
      await auth.selectRole(role);
      navigate({ to: `/dashboard/${role}` });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to select role:', err);
    }
  };

  if (auth.isLoading) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <span className="animate-pulse text-muted-foreground text-sm font-medium">
          Checking session...
        </span>
      </div>
    );
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-8 bg-card p-8 rounded-lg border border-border shadow-sm text-center">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground">
            Select Active Role
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Choose which dashboard you would like to open for this session
          </p>
        </div>

        <div className="mt-8 space-y-3">
          {auth.roles.map((role) => (
            <button
              key={role}
              onClick={() => handleSelect(role as 'admin' | 'seller' | 'buyer' | 'driver')}
              className="flex w-full items-center justify-between rounded-md border border-input bg-background hover:bg-accent/50 px-4 py-3 text-sm font-semibold text-foreground transition-all capitalize shadow-sm cursor-pointer"
            >
              <span>{role} Dashboard</span>
              {auth.activeRole === role && (
                <span className="inline-flex h-2 w-2 rounded-full bg-primary" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
