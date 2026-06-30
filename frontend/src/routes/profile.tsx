import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import { useAuth } from '@/lib/auth/context';
import { useProfile } from '@/features/profile/hooks/use-profile';
import { ProfileDetails } from '@/features/profile/components/profile-details';
import { RolesSection } from '@/features/profile/components/roles-section';
import { FinancialOverview } from '@/features/profile/components/financial-overview';

export const Route = createFileRoute('/profile')({
  component: ProfilePage,
});

function ProfilePage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const { financialSummary, isLoading: isFinancialLoading } = useProfile(!!auth.user);

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
        <ProfileDetails user={auth.user} />
        <RolesSection activeRole={auth.activeRole} roles={auth.roles} />
      </div>

      <FinancialOverview financialSummary={financialSummary} isLoading={isFinancialLoading} />
    </div>
  );
}
