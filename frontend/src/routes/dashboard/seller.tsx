import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth/context';
import { env } from '@/config';

export const Route = createFileRoute('/dashboard/seller')({
  component: SellerDashboard,
});

function SellerDashboard() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!auth.isLoading && auth.activeRole !== 'seller') {
      navigate({ to: '/select-role' });
    }
  }, [auth.isLoading, auth.activeRole, navigate]);

  const testPrivateEndpoint = async () => {
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const res = await fetch(`${env.VITE_API_URL}/api/private/seller`, {
        credentials: 'include',
      });
      if (!res.ok) {
        const text = await res.text();
        try {
          const body = JSON.parse(text);
          throw new Error(body.error || `HTTP ${res.status}`);
        } catch {
          throw new Error(text || `HTTP ${res.status}`);
        }
      }
      const data = await res.json();
      setResult(data.message);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  if (auth.isLoading || auth.activeRole !== 'seller') {
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
          Placeholder for store and product management operations (Level 2).
        </p>
      </div>

      <div className="bg-card border border-border p-6 rounded-lg shadow-sm">
        <h2 className="text-lg font-bold text-foreground mb-4">Level 1 Seller Area</h2>
        <p className="text-sm text-muted-foreground">
          You are logged in with the active role: <strong>seller</strong>. Store registration and
          product listing controls will be added in Level 2.
        </p>
      </div>

      <div className="bg-card border border-border p-6 rounded-lg shadow-sm">
        <h2 className="text-lg font-bold text-foreground mb-4">Private Endpoint Test</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Test the private endpoint that only allows users with the Seller role.
        </p>
        <button
          onClick={testPrivateEndpoint}
          disabled={loading}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Test Private Seller Endpoint'}
        </button>
        {result && (
          <p className="mt-4 text-sm text-green-600 bg-green-50 border border-green-200 rounded-md px-4 py-2">
            {result}
          </p>
        )}
        {error && (
          <p className="mt-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-4 py-2">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
