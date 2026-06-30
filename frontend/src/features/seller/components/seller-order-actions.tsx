import { Button } from '@/components/ui/button';
import { ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface SellerOrderActionsProps {
  status: string;
  onProcessClick: () => void;
}

export function SellerOrderActions({ status, onProcessClick }: SellerOrderActionsProps) {
  const { t } = useTranslation();

  return (
    <div className="bg-muted/50 rounded-lg p-4 border border-border/80 space-y-2">
      <div className="flex items-center gap-1.5 text-xs text-foreground font-bold uppercase tracking-wider">
        <ShieldCheck className="h-4 w-4 text-primary" />
        <span>{t('seller.actions.title')}</span>
      </div>
      {status === 'sedang_dikemas' ? (
        <>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {t('seller.actions.readyDesc')}
          </p>
          <Button
            className="w-full mt-2 cursor-pointer font-bold bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-200"
            onClick={onProcessClick}
          >
            {t('seller.actions.processButton')}
          </Button>
        </>
      ) : status === 'menunggu_pengirim' ? (
        <>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {t('seller.actions.waitingDesc')}
          </p>
          <Button className="w-full mt-2" disabled variant="secondary">
            {t('seller.actions.waitingButton')}
          </Button>
        </>
      ) : (
        <>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {t('seller.actions.noActionDesc')}{' '}
            <strong className="text-foreground capitalize font-bold">
              {status.replace('_', ' ')}
            </strong>
            .
          </p>
        </>
      )}
    </div>
  );
}
