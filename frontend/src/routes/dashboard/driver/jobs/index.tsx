import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { listAvailableJobsOptions } from '@/lib/api/generated/@tanstack/react-query.gen';
import { formatCurrency } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Truck, MapPin, Navigation, Eye, Inbox } from 'lucide-react';

export const Route = createFileRoute('/dashboard/driver/jobs/')({
  component: AvailableJobs,
});

function AvailableJobs() {
  const navigate = useNavigate();
  const { data: jobs, isLoading, error } = useQuery(listAvailableJobsOptions());

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((n) => (
          <Card key={n} className="animate-pulse">
            <div className="h-32 bg-muted rounded-lg" />
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center text-red-500">
        Error loading available jobs: {error instanceof Error ? error.message : 'Unknown error'}
      </div>
    );
  }

  if (!jobs || jobs.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center p-12 text-center">
        <Inbox className="h-12 w-12 text-muted-foreground mb-4" />
        <CardTitle className="mb-2">No Available Jobs</CardTitle>
        <CardDescription>
          There are no delivery jobs waiting to be picked up at the moment.
        </CardDescription>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-2">
        <h2 className="text-xl font-semibold tracking-tight">Available Delivery Jobs</h2>
        <Badge variant="secondary" className="px-3 py-1 font-semibold">
          {jobs.length} Job{jobs.length > 1 ? 's' : ''} Open
        </Badge>
      </div>

      <div className="grid gap-4">
        {jobs.map((job) => (
          <Card key={job.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <div className="space-y-1">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Truck className="h-4 w-4 text-primary" />
                  {job.storeName}
                </CardTitle>
                <CardDescription className="text-xs capitalize font-medium text-foreground">
                  Method: {job.deliveryMethod}
                </CardDescription>
              </div>
              <div className="text-right">
                <span className="text-lg font-extrabold text-primary">
                  {formatCurrency(job.deliveryFee)}
                </span>
                <p className="text-xs text-muted-foreground">Earning</p>
              </div>
            </CardHeader>
            <CardContent className="pt-2 space-y-4">
              <div className="space-y-2 text-sm border-t border-border pt-3">
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-semibold text-xs text-muted-foreground">Pickup Store</p>
                    <p className="text-foreground">{job.storeName}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Navigation className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-semibold text-xs text-muted-foreground">Drop-off Address</p>
                    <p className="text-foreground font-medium">
                      {job.addressSnapshot.recipientName} ({job.addressSnapshot.label})
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {job.addressSnapshot.district}, {job.addressSnapshot.city},{' '}
                      {job.addressSnapshot.province}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  onClick={() =>
                    navigate({
                      to: '/dashboard/driver/jobs/$jobId',
                      params: { jobId: job.id },
                    })
                  }
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Eye className="h-4 w-4" />
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
