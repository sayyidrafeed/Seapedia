import { createFileRoute } from '@tanstack/react-router';
import { useDiscounts } from '@/features/admin/hooks/use-discounts';
import { DiscountsTabBar } from '@/features/admin/components/discounts-tab-bar';
import { VoucherTable } from '@/features/admin/components/voucher-table';
import { PromoTable } from '@/features/admin/components/promo-table';
import { CreateVoucherForm } from '@/features/admin/components/create-voucher-form';
import { CreatePromoForm } from '@/features/admin/components/create-promo-form';
import { Button } from '@/components/ui/button';
import { Ticket, Percent, Plus } from 'lucide-react';

export const Route = createFileRoute('/dashboard/admin/discounts')({
  component: AdminDiscountsPage,
});

function AdminDiscountsPage() {
  const {
    activeTab,
    showVoucherForm,
    showPromoForm,
    vouchers,
    promos,
    isVouchersLoading,
    isPromosLoading,
    isVoucherCreating,
    isPromoCreating,
    vCode,
    vAmount,
    vMinOrder,
    vExpiry,
    vUsage,
    pCode,
    pPercent,
    pMaxDiscount,
    pMinOrder,
    pExpiry,
    setActiveTab,
    setShowVoucherForm,
    setShowPromoForm,
    setVCode,
    setVAmount,
    setVMinOrder,
    setVExpiry,
    setVUsage,
    setPCode,
    setPPercent,
    setPMaxDiscount,
    setPMinOrder,
    setPExpiry,
    createVoucher,
    createPromo,
  } = useDiscounts();

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Tabs Bar */}
        <DiscountsTabBar
          activeTab={activeTab}
          onTabChange={(tab) => {
            setActiveTab(tab);
            if (tab === 'vouchers') setShowPromoForm(false);
            else setShowVoucherForm(false);
          }}
        />

        {/* Create Buttons */}
        <div>
          {activeTab === 'vouchers' ? (
            <Button
              onClick={() => setShowVoucherForm(!showVoucherForm)}
              className="flex items-center gap-2 rounded-xl font-bold cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              {showVoucherForm ? 'Hide Form' : 'New Voucher'}
            </Button>
          ) : (
            <Button
              onClick={() => setShowPromoForm(!showPromoForm)}
              className="flex items-center gap-2 rounded-xl font-bold cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              {showPromoForm ? 'Hide Form' : 'New Promo'}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Main List Section */}
        <div className="lg:col-span-2 space-y-6">
          {activeTab === 'vouchers' ? (
            <VoucherTable vouchers={vouchers} isLoading={isVouchersLoading} />
          ) : (
            <PromoTable promos={promos} isLoading={isPromosLoading} />
          )}
        </div>

        {/* Sidebar Form Section */}
        <div className="space-y-6">
          {showVoucherForm && activeTab === 'vouchers' && (
            <CreateVoucherForm
              vCode={vCode}
              vAmount={vAmount}
              vMinOrder={vMinOrder}
              vUsage={vUsage}
              vExpiry={vExpiry}
              isPending={isVoucherCreating}
              onCodeChange={setVCode}
              onAmountChange={setVAmount}
              onMinOrderChange={setVMinOrder}
              onUsageChange={setVUsage}
              onExpiryChange={setVExpiry}
              onSubmit={createVoucher}
            />
          )}

          {showPromoForm && activeTab === 'promos' && (
            <CreatePromoForm
              pCode={pCode}
              pPercent={pPercent}
              pMaxDiscount={pMaxDiscount}
              pMinOrder={pMinOrder}
              pExpiry={pExpiry}
              isPending={isPromoCreating}
              onCodeChange={setPCode}
              onPercentChange={setPPercent}
              onMaxDiscountChange={setPMaxDiscount}
              onMinOrderChange={setPMinOrder}
              onExpiryChange={setPExpiry}
              onSubmit={createPromo}
            />
          )}

          {!showVoucherForm && activeTab === 'vouchers' && (
            <div className="p-6 border border-dashed rounded-xl flex flex-col items-center justify-center text-center space-y-3 text-muted-foreground">
              <Ticket className="h-8 w-8 text-muted-foreground/60" />
              <p className="text-xs">
                To create a new flat discount voucher, click the button in the top right.
              </p>
            </div>
          )}

          {!showPromoForm && activeTab === 'promos' && (
            <div className="p-6 border border-dashed rounded-xl flex flex-col items-center justify-center text-center space-y-3 text-muted-foreground">
              <Percent className="h-8 w-8 text-muted-foreground/60" />
              <p className="text-xs">
                To launch a new percentage promo campaign, click the button in the top right.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
