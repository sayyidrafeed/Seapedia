import { createFileRoute } from '@tanstack/react-router';
import { useSellerOrders } from '@/features/seller/hooks/use-seller-orders';
import { SellerOrderTable } from '@/features/seller/components/seller-order-table';
import { ProcessOrderModal } from '@/features/seller/components/process-order-modal';
import { ClipboardList } from 'lucide-react';

export const Route = createFileRoute('/dashboard/seller/orders/')({
  component: SellerIncomingOrdersPage,
});

function SellerIncomingOrdersPage() {
  const {
    orders,
    isLoading,
    error,
    processingOrderId,
    isProcessing,
    setProcessingOrderId,
    confirmProcess,
  } = useSellerOrders();

  if (isLoading) {
    return (
      <div className="container mx-auto px-6 py-8 max-w-5xl animate-pulse space-y-6">
        <div className="h-10 bg-muted rounded w-1/4" />
        <div className="space-y-4">
          <div className="h-24 bg-muted rounded-xl" />
          <div className="h-24 bg-muted rounded-xl" />
          <div className="h-24 bg-muted rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !orders) {
    return (
      <div className="container mx-auto px-6 py-8 max-w-5xl text-center text-sm text-destructive">
        Error loading incoming orders. Please check if your store is created properly.
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8 max-w-5xl space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Incoming Orders</h1>
        <p className="text-sm text-muted-foreground">
          Manage and process orders placed at your store
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center border border-dashed border-border rounded-2xl bg-card/30">
          <div className="rounded-full bg-primary/10 p-6 text-primary mb-6">
            <ClipboardList className="h-12 w-12" />
          </div>
          <h3 className="text-xl font-bold text-foreground">No incoming orders yet</h3>
          <p className="text-sm text-muted-foreground mt-2 max-w-sm">
            When buyers purchase products from your store, their orders will appear here. Keep up
            the good work!
          </p>
        </div>
      ) : (
        <SellerOrderTable
          orders={orders}
          processingOrderId={processingOrderId}
          onProcessOrder={setProcessingOrderId}
        />
      )}

      <ProcessOrderModal
        isOpen={!!processingOrderId}
        note=""
        isPending={isProcessing}
        onNoteChange={() => {}} // Note is not used in index order processing list, only path
        onClose={() => setProcessingOrderId(null)}
        onConfirm={confirmProcess}
      />
    </div>
  );
}
