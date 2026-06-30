import { Button } from '@/components/ui/button';
import { Clock, RefreshCw, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface TimeSimulationControlsProps {
  isPending: boolean;
  onSimulate: (hours: number) => void;
}

export function TimeSimulationControls({ isPending, onSimulate }: TimeSimulationControlsProps) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-2">
      <Button
        onClick={() => onSimulate(24)}
        disabled={isPending}
        variant="outline"
        className="flex items-center gap-2 rounded-xl font-bold cursor-pointer"
      >
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Clock className="h-4 w-4" />}
        {t('admin.dashboard.simulateDay')}
      </Button>
      <Button
        onClick={() => onSimulate(0)}
        disabled={isPending}
        variant="ghost"
        className="flex items-center gap-2 rounded-xl text-muted-foreground hover:text-foreground cursor-pointer"
      >
        <RefreshCw className="h-4 w-4" />
        {t('admin.dashboard.resetTime')}
      </Button>
    </div>
  );
}
