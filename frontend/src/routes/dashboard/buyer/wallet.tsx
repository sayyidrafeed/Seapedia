import { createFileRoute } from '@tanstack/react-router';
import { useWallet } from '@/features/buyer/hooks/use-wallet';
import { WalletBalanceCard } from '@/features/buyer/components/wallet-balance-card';
import { TopUpForm } from '@/features/buyer/components/top-up-form';
import { PendingPaymentCard } from '@/features/buyer/components/pending-payment-card';
import { TransactionHistoryTable } from '@/features/buyer/components/transaction-history-table';

export const Route = createFileRoute('/dashboard/buyer/wallet')({
  component: BuyerWalletPage,
});

function BuyerWalletPage() {
  const {
    wallet,
    transactions,
    isWalletLoading,
    isTxLoading,
    topUpAmount,
    customAmount,
    selectedMethod,
    pendingPayment,
    isRequesting,
    isSimulating,
    setSelectedMethod,
    handlePresetSelect,
    handleCustomAmountChange,
    handleRequestTopUp,
    simulatePayment,
    cancelPending,
  } = useWallet();

  return (
    <div className="space-y-8">
      {/* Wallet overview and actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Balance Display */}
        <div className="lg:col-span-1 space-y-6">
          <WalletBalanceCard balance={wallet?.balance} isLoading={isWalletLoading} />
        </div>

        {/* Top-up Form / Payment Simulation Area */}
        <div className="lg:col-span-2">
          {!pendingPayment ? (
            <TopUpForm
              topUpAmount={topUpAmount}
              customAmount={customAmount}
              selectedMethod={selectedMethod}
              isPending={isRequesting}
              onPresetSelect={handlePresetSelect}
              onCustomAmountChange={handleCustomAmountChange}
              onMethodSelect={setSelectedMethod}
              onSubmit={handleRequestTopUp}
            />
          ) : (
            <PendingPaymentCard
              pendingPayment={pendingPayment}
              isSimulating={isSimulating}
              onCancel={cancelPending}
              onSimulateSuccess={simulatePayment}
            />
          )}
        </div>
      </div>

      {/* Transaction History Section */}
      <TransactionHistoryTable transactions={transactions} isLoading={isTxLoading} />
    </div>
  );
}
