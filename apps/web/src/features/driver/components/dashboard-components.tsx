import { Link } from '@tanstack/react-router';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Truck, History, Landmark, MapPin, Navigation, HelpCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

interface Address {
  recipientName: string;
  phoneNumber: string;
  fullAddress: string;
  district: string;
  city: string;
  province: string;
  postalCode: string;
  label: string;
}

interface Job {
  id: string;
  storeName: string;
  deliveryFee: number;
  deliveryMethod: string;
  addressSnapshot: Address;
  updatedAt: string;
}

interface Stats {
  activeJobs: Job[];
  completedJobsCount: number;
  totalEarnings: number;
}

export function StatsCards({ stats }: { stats: Stats }) {
  const { t } = useTranslation();

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card className="flex flex-col justify-between p-4">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-muted-foreground">
            {t('driver.stats.activeDeliveries')}
          </span>
          <Truck className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="text-2xl font-bold mt-2">{stats.activeJobs.length}</div>
      </Card>
      <Card className="flex flex-col justify-between p-4">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-muted-foreground">
            {t('driver.stats.completedJobs')}
          </span>
          <History className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="text-2xl font-bold mt-2">{stats.completedJobsCount}</div>
      </Card>
      <Card className="flex flex-col justify-between p-4 relative group">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-muted-foreground flex items-center gap-1">
            {t('driver.stats.totalEarnings')}
            <div className="relative inline-block cursor-help text-muted-foreground/60 hover:text-foreground">
              <HelpCircle className="h-3.5 w-3.5" />
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 hidden group-hover:block bg-popover text-popover-foreground border text-[10px] p-2 rounded shadow-md z-50 leading-relaxed font-normal">
                {t('driver.stats.earningTooltip')}
              </span>
            </div>
          </span>
          <Landmark className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="text-2xl font-bold mt-2 text-green-600">
          {formatCurrency(stats.totalEarnings)}
        </div>
      </Card>
    </div>
  );
}

export function ActiveDeliveriesCard({
  activeJobs,
  isPending,
  onComplete,
}: {
  activeJobs: Job[];
  isPending: boolean;
  onComplete: (jobId: string) => void;
}) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('driver.stats.activeJobsCount', { count: activeJobs.length })}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {activeJobs.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <p>{t('driver.stats.noActiveJobs')}</p>
            <Button asChild className="mt-4" variant="outline">
              <Link to="/dashboard/driver/jobs">{t('driver.stats.findJobs')}</Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {activeJobs.map((job) => (
              <Card key={job.id} className="p-4 border-primary/20 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <Badge className="capitalize mb-1">{job.deliveryMethod}</Badge>
                    <div className="font-bold">{job.storeName}</div>
                  </div>
                  <span className="font-bold text-primary">{formatCurrency(job.deliveryFee)}</span>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs text-muted-foreground block font-semibold">
                      {t('driver.stats.pickup')}
                    </span>
                    {job.storeName}
                    {t('driver.stats.storeSuffix')}
                  </div>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <Navigation className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs text-muted-foreground block font-semibold">
                      {t('driver.stats.dropoff')}
                    </span>
                    {job.addressSnapshot.recipientName}
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {job.addressSnapshot.fullAddress}, {job.addressSnapshot.city}
                    </p>
                  </div>
                </div>
                <Button
                  className="w-full mt-2"
                  disabled={isPending}
                  onClick={() => onComplete(job.id)}
                >
                  {isPending ? t('driver.stats.completing') : t('driver.stats.completeButton')}
                </Button>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
