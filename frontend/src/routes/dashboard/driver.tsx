import { createFileRoute, Outlet, useNavigate, Link } from '@tanstack/react-router';
import { useEffect } from 'react';
import { useAuth } from '@/lib/auth/context';

export const Route = createFileRoute('/dashboard/driver')({
  component: DriverLayout,
});

function DriverLayout() {
  const auth = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!auth.isLoading && auth.activeRole !== 'driver') {
      navigate({ to: '/select-role' });
    }
  }, [auth.isLoading, auth.activeRole, navigate]);

  if (auth.isLoading || auth.activeRole !== 'driver') {
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
          <h1 className="text-3xl font-extrabold tracking-tight capitalize">Driver Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your delivery jobs, track progress, and view earnings.
          </p>
        </div>
        <div className="space-x-4">
          <Link
            to="/dashboard/driver"
            activeOptions={{ exact: true }}
            className="text-sm font-medium hover:underline cursor-pointer border-none bg-transparent"
            activeProps={{ className: 'text-primary font-bold' }}
            inactiveProps={{ className: 'text-muted-foreground' }}
          >
            Overview
          </Link>
          <Link
            to="/dashboard/driver/jobs"
            className="text-sm font-medium hover:underline cursor-pointer border-none bg-transparent"
            activeProps={{ className: 'text-primary font-bold' }}
            inactiveProps={{ className: 'text-muted-foreground' }}
          >
            Available Jobs
          </Link>
        </div>
      </div>

      <Outlet />
    </div>
  );
}
