import { createFileRoute, Outlet, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import { useAuth } from '@/lib/auth/context';

export const Route = createFileRoute('/dashboard/admin')({
  component: AdminLayout,
});

function AdminLayout() {
  const auth = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!auth.isLoading && auth.activeRole !== 'admin') {
      navigate({ to: '/select-role' });
    }
  }, [auth.isLoading, auth.activeRole, navigate]);

  if (auth.isLoading || auth.activeRole !== 'admin') {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <span className="animate-pulse text-muted-foreground text-sm font-medium">
          Checking authorization...
        </span>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-12 space-y-6">
      <div className="border-b border-border pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight capitalize">Admin Portal</h1>
          <p className="text-sm text-muted-foreground mt-1">
            System configuration, promotions, and marketplace monitoring.
          </p>
        </div>
        <div className="space-x-4">
          <button
            onClick={() => navigate({ to: '/dashboard/admin' })}
            className="text-sm font-medium hover:underline text-primary cursor-pointer border-none bg-transparent"
          >
            Dashboard
          </button>
          <button
            onClick={() => navigate({ to: '/dashboard/admin/discounts' })}
            className="text-sm font-medium hover:underline text-primary cursor-pointer border-none bg-transparent"
          >
            Discounts Management
          </button>
        </div>
      </div>

      <Outlet />
    </div>
  );
}
