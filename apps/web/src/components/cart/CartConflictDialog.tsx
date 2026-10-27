import { Button } from '@/components/ui/button';

interface CartConflictDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  currentStoreName: string | null;
  newStoreName: string;
}

export function CartConflictDialog({
  isOpen,
  onClose,
  onConfirm,
  currentStoreName,
  newStoreName,
}: CartConflictDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-modal animate-in zoom-in-95 duration-200">
        <h2 className="text-lg font-bold text-foreground">Switch Store & Clear Cart?</h2>
        <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
          Your cart currently contains items from{' '}
          <strong className="text-foreground">{currentStoreName || 'another store'}</strong>.
          Seapedia follows a single-store checkout rule.
        </p>
        <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
          Would you like to clear your cart and add items from{' '}
          <strong className="text-foreground">{newStoreName}</strong> instead?
        </p>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="destructive" size="sm" onClick={onConfirm}>
            Clear Cart & Add
          </Button>
        </div>
      </div>
    </div>
  );
}
