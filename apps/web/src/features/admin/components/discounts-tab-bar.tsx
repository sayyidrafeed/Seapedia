import { Ticket, Percent } from 'lucide-react';
import type { ActiveTab } from '../hooks/use-discounts';
import { useTranslation } from 'react-i18next';

interface DiscountsTabBarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
}

export function DiscountsTabBar({ activeTab, onTabChange }: DiscountsTabBarProps) {
  const { t } = useTranslation();

  return (
    <div className="flex bg-muted p-1 rounded-xl w-fit">
      <button
        onClick={() => onTabChange('vouchers')}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition cursor-pointer border-none ${
          activeTab === 'vouchers'
            ? 'bg-card text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        <Ticket className="h-4 w-4" />
        {t('admin.discounts.vouchersTab')}
      </button>
      <button
        onClick={() => onTabChange('promos')}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition cursor-pointer border-none ${
          activeTab === 'promos'
            ? 'bg-card text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        <Percent className="h-4 w-4" />
        {t('admin.discounts.promosTab')}
      </button>
    </div>
  );
}
