import { createFileRoute } from '@tanstack/react-router';
import { useWallet } from '@/features/buyer/hooks/use-wallet';
import { WalletBalanceCard } from '@/features/buyer/components/wallet-balance-card';
import { TopUpForm } from '@/features/buyer/components/top-up-form';
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
    isPending,
    handlePresetSelect,
    handleCustomAmountChange,
    handleRequestTopUp,
  } = useWallet();

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Wallet overview and actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Balance Display */}
        <div className="lg:col-span-1 space-y-6">
          <WalletBalanceCard balance={wallet?.balance} isLoading={isWalletLoading} />
        </div>

        {/* Top-up Form Area */}
        <div className="lg:col-span-2">
          <TopUpForm
            topUpAmount={topUpAmount}
            customAmount={customAmount}
            isPending={isPending}
            onPresetSelect={handlePresetSelect}
            onCustomAmountChange={handleCustomAmountChange}
            onSubmit={handleRequestTopUp}
          />
        </div>
      </div>

      {/* Transaction History Section */}
      <TransactionHistoryTable transactions={transactions} isLoading={isTxLoading} />
    </div>
  );
}
