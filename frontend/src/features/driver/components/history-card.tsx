import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
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

export function HistoryCard({
  jobs,
  total,
  page,
  limit,
  isLoading,
  onPrevPage,
  onNextPage,
}: {
  jobs: Job[];
  total: number;
  page: number;
  limit: number;
  isLoading: boolean;
  onPrevPage: () => void;
  onNextPage: () => void;
}) {
  const { t } = useTranslation();
  const totalPages = Math.ceil(total / limit);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('driver.history.title')}</CardTitle>
        <CardDescription>{t('driver.history.desc')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="text-center py-6 text-muted-foreground text-sm">
            {t('driver.history.loading')}
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground text-sm">
            {t('driver.history.noJobs')}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="border rounded-md overflow-hidden">
              <table className="w-full text-sm text-left border-collapse">
                <thead>
                  <tr className="bg-muted/50 border-b">
                    <th className="p-3 font-semibold text-muted-foreground">
                      {t('buyer.orders.historyTableDate')}
                    </th>
                    <th className="p-3 font-semibold text-muted-foreground">
                      {t('driver.history.table.store')}
                    </th>
                    <th className="p-3 font-semibold text-muted-foreground">
                      {t('driver.history.table.recipient')}
                    </th>
                    <th className="p-3 font-semibold text-muted-foreground">
                      {t('driver.history.table.method')}
                    </th>
                    <th className="p-3 font-semibold text-muted-foreground text-right">
                      {t('driver.history.table.earning')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((job) => (
                    <tr key={job.id} className="border-b last:border-0 hover:bg-muted/20">
                      <td className="p-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(job.updatedAt).toLocaleString('id-ID', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </td>
                      <td className="p-3 font-medium capitalize">{job.storeName}</td>
                      <td className="p-3 text-muted-foreground">
                        {job.addressSnapshot.recipientName}
                      </td>
                      <td className="p-3">
                        <Badge variant="secondary" className="capitalize text-[10px]">
                          {job.deliveryMethod}
                        </Badge>
                      </td>
                      <td className="p-3 text-right font-bold text-green-600">
                        +{formatCurrency(job.deliveryFee)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-muted-foreground">
                  {t('driver.history.showing', { page, totalPages, total })}
                </span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={onPrevPage} disabled={page === 1}>
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    {t('driver.history.prev')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onNextPage}
                    disabled={page === totalPages}
                  >
                    {t('driver.history.next')}
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
