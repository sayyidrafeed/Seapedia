import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import { useAuth } from '@/lib/auth/context';
import { formatCurrency } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { getCurrentUserFinancialSummaryOptions } from '@/lib/api/generated/@tanstack/react-query.gen';

export const Route = createFileRoute('/profile')({
  component: ProfilePage,
});

function ProfilePage() {
  const auth = useAuth();
  const navigate = useNavigate();

  const { data: financialSummary, isLoading: isFinancialLoading } = useQuery({
    ...getCurrentUserFinancialSummaryOptions(),
    enabled: !!auth.user,
  });

  useEffect(() => {
    if (!auth.isLoading && !auth.user) {
      navigate({ to: '/login' });
    }
  }, [auth.isLoading, auth.user, navigate]);

  if (auth.isLoading || !auth.user) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <span className="animate-pulse text-muted-foreground text-sm font-medium">
          Loading profile...
        </span>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-12 max-w-4xl space-y-8">
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight text-foreground">My Profile</h1>
        <p className="text-muted-foreground mt-2">
          Manage your Seapedia account information and balances.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-card border border-border p-6 rounded-lg shadow-sm space-y-6">
          <h2 className="text-xl font-bold border-b border-border pb-3">Personal Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-xs font-semibold text-muted-foreground uppercase">
                Username
              </span>
              <p className="text-foreground font-medium mt-1">{auth.user.username}</p>
            </div>
            <div>
              <span className="text-xs font-semibold text-muted-foreground uppercase">
                Email Address
              </span>
              <p className="text-foreground font-medium mt-1">{auth.user.email}</p>
            </div>
            <div>
              <span className="text-xs font-semibold text-muted-foreground uppercase">
                Display Name
              </span>
              <p className="text-foreground font-medium mt-1">
                {(auth.user.name as string) || 'Not set'}
              </p>
            </div>
            <div>
              <span className="text-xs font-semibold text-muted-foreground uppercase">
                Joined Date
              </span>
              <p className="text-foreground font-medium mt-1">
                {new Date(auth.user.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border p-6 rounded-lg shadow-sm space-y-4">
          <h2 className="text-xl font-bold border-b border-border pb-3">Roles & Session</h2>
          <div>
            <span className="text-xs font-semibold text-muted-foreground uppercase">
              Active Role
            </span>
            <p className="text-foreground font-semibold mt-1 capitalize text-primary">
              {auth.activeRole || 'None'}
            </p>
          </div>
          <div>
            <span className="text-xs font-semibold text-muted-foreground uppercase">
              Roles Owned
            </span>
            <div className="flex flex-wrap gap-2 mt-1">
              {auth.roles.map((r) => (
                <span
                  key={r}
                  className="rounded-full bg-secondary text-secondary-foreground text-xs px-2.5 py-0.5 capitalize border border-border"
                >
                  {r}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-bold">Financial Overview</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {/* Buyer Card */}
          <div
            className={`bg-card border p-6 rounded-lg shadow-sm transition-opacity duration-200 ${
              financialSummary?.buyer === undefined
                ? 'border-border/40 opacity-60'
                : 'border-border'
            }`}
          >
            <div className="flex justify-between items-start">
              <span className="text-xs font-semibold text-muted-foreground uppercase">
                Buyer Wallet Balance
              </span>
              {financialSummary?.buyer === undefined && (
                <span className="text-[10px] font-semibold text-muted-foreground/80 bg-secondary px-1.5 py-0.5 rounded">
                  Not Owned
                </span>
              )}
            </div>
            {isFinancialLoading ? (
              <p className="text-2xl font-bold text-foreground mt-2 animate-pulse">...</p>
            ) : financialSummary?.buyer !== undefined ? (
              <p className="text-2xl font-bold text-foreground mt-2">
                {formatCurrency(financialSummary.buyer.balance)}
              </p>
            ) : (
              <p className="text-sm font-medium text-muted-foreground mt-2.5 italic">
                Role not active
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1">Simulated transaction wallet</p>
          </div>

          {/* Seller Card */}
          <div
            className={`bg-card border p-6 rounded-lg shadow-sm transition-opacity duration-200 ${
              financialSummary?.seller === undefined
                ? 'border-border/40 opacity-60'
                : 'border-border'
            }`}
          >
            <div className="flex justify-between items-start">
              <span className="text-xs font-semibold text-muted-foreground uppercase">
                Seller Earnings
              </span>
              {financialSummary?.seller === undefined && (
                <span className="text-[10px] font-semibold text-muted-foreground/80 bg-secondary px-1.5 py-0.5 rounded">
                  Not Owned
                </span>
              )}
            </div>
            {isFinancialLoading ? (
              <p className="text-2xl font-bold text-foreground mt-2 animate-pulse">...</p>
            ) : financialSummary?.seller !== undefined ? (
              <p className="text-2xl font-bold text-foreground mt-2">
                {formatCurrency(financialSummary.seller.income)}
              </p>
            ) : (
              <p className="text-sm font-medium text-muted-foreground mt-2.5 italic">
                Role not active
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1">Accumulated store sales revenue</p>
          </div>

          {/* Driver Card */}
          <div
            className={`bg-card border p-6 rounded-lg shadow-sm transition-opacity duration-200 ${
              financialSummary?.driver === undefined
                ? 'border-border/40 opacity-60'
                : 'border-border'
            }`}
          >
            <div className="flex justify-between items-start">
              <span className="text-xs font-semibold text-muted-foreground uppercase">
                Driver Payouts
              </span>
              {financialSummary?.driver === undefined && (
                <span className="text-[10px] font-semibold text-muted-foreground/80 bg-secondary px-1.5 py-0.5 rounded">
                  Not Owned
                </span>
              )}
            </div>
            {isFinancialLoading ? (
              <p className="text-2xl font-bold text-foreground mt-2 animate-pulse">...</p>
            ) : financialSummary?.driver !== undefined ? (
              <p className="text-2xl font-bold text-foreground mt-2">
                {formatCurrency(financialSummary.driver.earnings)}
              </p>
            ) : (
              <p className="text-sm font-medium text-muted-foreground mt-2.5 italic">
                Role not active
              </p>
            )}

            <p className="text-xs text-muted-foreground mt-1">Completed shipping job payouts</p>
          </div>
        </div>
      </div>
    </div>
  );
}
