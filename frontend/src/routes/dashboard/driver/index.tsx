import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getDriverStatsOptions,
  completeDeliveryJobMutation,
} from '@/lib/api/generated/@tanstack/react-query.gen';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Truck, History, Landmark, MapPin, Navigation, Calendar } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import type { CompleteDeliveryJobError } from '@/lib/api/generated';
import { toast } from 'sonner';
import { SecurityTest } from './components/SecurityTest';

export const Route = createFileRoute('/dashboard/driver/')({
  component: DriverOverview,
});

function DriverOverview() {
  const queryClient = useQueryClient();
  const { data: stats, isLoading, error } = useQuery(getDriverStatsOptions());

  const completeMutation = useMutation({
    ...completeDeliveryJobMutation(),
    onSuccess: (data) => {
      toast.success(data.message || 'Delivery completed successfully!');
      queryClient.invalidateQueries({ queryKey: ['getDriverStats'] });
      queryClient.invalidateQueries({ queryKey: ['listAvailableJobs'] });
    },
    onError: (err: CompleteDeliveryJobError) => {
      const apiErr = err as { body?: { error?: string } };
      toast.error(apiErr.body?.error || 'Failed to complete delivery');
    },
  });

  if (isLoading)
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-muted rounded-lg" />
          ))}
        </div>
        <div className="h-48 bg-muted rounded-lg" />
      </div>
    );
  if (error || !stats)
    return (
      <Card className="p-6 text-center text-red-500">
        Error: {error instanceof Error ? error.message : 'Failed to load'}
      </Card>
    );

  return (
    <div className="space-y-6">
      {/* Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="flex flex-col justify-between p-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Active Deliveries</span>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold mt-2">{stats.activeJobs.length}</div>
        </Card>
        <Card className="flex flex-col justify-between p-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Completed Jobs</span>
            <History className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold mt-2">{stats.completedJobsCount}</div>
        </Card>
        <Card className="flex flex-col justify-between p-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Total Earnings</span>
            <Landmark className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold mt-2">{formatCurrency(stats.totalEarnings)}</div>
        </Card>
      </div>

      {/* Active Jobs */}
      <Card>
        <CardHeader>
          <CardTitle>Active Jobs ({stats.activeJobs.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {stats.activeJobs.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <p>No active jobs. Claim some available jobs!</p>
              <Button asChild className="mt-4" variant="outline">
                <Link to="/dashboard/driver/jobs">Find Jobs</Link>
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {stats.activeJobs.map((job) => (
                <Card key={job.id} className="p-4 border-primary/20 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <Badge className="capitalize mb-1">{job.deliveryMethod}</Badge>
                      <div className="font-bold">{job.storeName}</div>
                    </div>
                    <span className="font-bold text-primary">
                      {formatCurrency(job.deliveryFee)}
                    </span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs text-muted-foreground block font-semibold">
                        PICKUP
                      </span>
                      {job.storeName} Store
                    </div>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <Navigation className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs text-muted-foreground block font-semibold">
                        DROPOFF
                      </span>
                      {job.addressSnapshot.recipientName}
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {job.addressSnapshot.fullAddress}, {job.addressSnapshot.city}
                      </p>
                    </div>
                  </div>
                  <Button
                    className="w-full mt-2"
                    disabled={completeMutation.isPending}
                    onClick={() => completeMutation.mutate({ path: { id: job.id } })}
                  >
                    {completeMutation.isPending ? 'Completing...' : 'Complete Delivery'}
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* History */}
      <Card>
        <CardHeader>
          <CardTitle>Delivery History</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.completedJobs.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground text-sm">
              No completed jobs yet.
            </div>
          ) : (
            <div className="space-y-2">
              {stats.completedJobs.map((job) => (
                <div
                  key={job.id}
                  className="flex justify-between items-center p-3 border rounded-lg bg-muted/40 text-sm"
                >
                  <div>
                    <div className="font-semibold">{job.storeName}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Calendar className="h-3 w-3" /> {new Date(job.updatedAt).toLocaleString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-green-600">
                      +{formatCurrency(job.deliveryFee)}
                    </div>
                    <Badge variant="secondary" className="text-[10px] capitalize">
                      {job.deliveryMethod}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security Test */}
      <SecurityTest />
    </div>
  );
}
