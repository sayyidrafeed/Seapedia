import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';

interface ProcessOrderModalProps {
  isOpen: boolean;
  note: string;
  isPending: boolean;
  onNoteChange: (value: string) => void;
  onClose: () => void;
  onConfirm: () => void;
}

export function ProcessOrderModal({
  isOpen,
  note,
  isPending,
  onNoteChange,
  onClose,
  onConfirm,
}: ProcessOrderModalProps) {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-overlay backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-card border border-border rounded-xl shadow-modal w-full max-w-md overflow-hidden transform scale-100 transition-all duration-250 p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-foreground">{t('seller.modal.processTitle')}</h3>
          <p className="text-xs text-muted-foreground">{t('seller.modal.processDesc')}</p>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="note-input"
            className="text-xs font-bold text-foreground uppercase tracking-wider block"
          >
            {t('seller.modal.noteLabel')}
          </label>
          <textarea
            id="note-input"
            className="w-full min-h-[80px] rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none"
            placeholder={t('seller.modal.notePlaceholder')}
            value={note}
            onChange={(e) => onNoteChange(e.target.value)}
            maxLength={1000}
            disabled={isPending}
          />
          <p className="text-[10px] text-muted-foreground text-right">
            {t('seller.modal.charCount', { count: note.length })}
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isPending}
            className="cursor-pointer"
          >
            {t('buyer.wallet.cancel')}
          </Button>
          <Button
            size="sm"
            onClick={onConfirm}
            disabled={isPending}
            className="cursor-pointer font-bold"
          >
            {isPending ? t('seller.orders.processing') : t('seller.modal.confirmButton')}
          </Button>
        </div>
      </div>
    </div>
  );
}
