import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldCheck } from 'lucide-react';
import { privateDriverEndpoint } from '@/lib/api/generated';

export function SecurityTest() {
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testError, setTestError] = useState<string | null>(null);
  const [testLoading, setTestLoading] = useState(false);

  const testPrivateEndpoint = async () => {
    setTestLoading(true);
    setTestResult(null);
    setTestError(null);
    try {
      const { data, error: apiError } = await privateDriverEndpoint();
      if (apiError) throw new Error(apiError.error || 'Request failed');
      if (data) setTestResult(data.message);
    } catch (e) {
      setTestError(e instanceof Error ? e.message : 'Request failed');
    } finally {
      setTestLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          Security Test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={testPrivateEndpoint} disabled={testLoading}>
          {testLoading ? 'Testing...' : 'Test Private Driver Endpoint'}
        </Button>
        {testResult && (
          <div className="p-3 rounded-md bg-green-50 border border-green-200 text-sm text-green-700">
            <strong>Success:</strong> {testResult}
          </div>
        )}
        {testError && (
          <div className="p-3 rounded-md bg-red-50 border border-red-200 text-sm text-red-700">
            <strong>Error:</strong> {testError}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
