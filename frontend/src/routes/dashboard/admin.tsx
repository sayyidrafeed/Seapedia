import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import { useAuth } from '@/lib/auth/context';

export const Route = createFileRoute('/dashboard/admin')({
  component: AdminDashboard,
});

function AdminDashboard() {
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
      <div className="border-b border-border pb-4">
        <h1 className="text-3xl font-extrabold tracking-tight capitalize">
          {auth.activeRole} Dashboard
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Placeholder for Administrative monitoring controls (Level 6).
        </p>
      </div>

      <div className="bg-card border border-border p-6 rounded-lg shadow-sm">
        <h2 className="text-lg font-bold text-foreground mb-4">Level 1 Admin Area</h2>
        <p className="text-sm text-muted-foreground">
          You are logged in with the active role: <strong>admin</strong>. Full monitoring and
          discount controls will be added in Level 6.
        </p>
      </div>
    </div>
  );
}
