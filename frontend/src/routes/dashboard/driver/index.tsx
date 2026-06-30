import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { privateDriverEndpoint } from '@/lib/api/generated';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldCheck, Truck, History, Landmark } from 'lucide-react';

export const Route = createFileRoute('/dashboard/driver/')({
  component: DriverOverview,
});

function DriverOverview() {
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const testPrivateEndpoint = async () => {
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const { data, error: apiError } = await privateDriverEndpoint();
      if (apiError) {
        throw new Error(apiError.error || 'Request failed');
      }
      if (data) {
        setResult(data.message);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Delivery</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">No Active Job</div>
            <p className="text-xs text-muted-foreground mt-1">
              Find and take an available job to get started
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Jobs</CardTitle>
            <History className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground mt-1">Total deliveries completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <Landmark className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rp 0</div>
            <p className="text-xs text-muted-foreground mt-1">Earnings from completed jobs</p>
          </CardContent>
        </Card>
      </div>

      {/* Private Endpoint Test */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Security & Authentication
          </CardTitle>
          <CardDescription>
            Test the private endpoint that only allows authenticated users with the active Driver
            role.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={testPrivateEndpoint} disabled={loading}>
            {loading ? 'Testing...' : 'Test Private Driver Endpoint'}
          </Button>

          {result && (
            <div className="p-3 rounded-md bg-green-50 border border-green-200 text-sm text-green-700">
              <strong>Success:</strong> {result}
            </div>
          )}

          {error && (
            <div className="p-3 rounded-md bg-red-50 border border-red-200 text-sm text-red-700">
              <strong>Error:</strong> {error}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
