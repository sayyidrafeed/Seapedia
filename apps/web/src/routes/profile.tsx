import { createFileRoute } from '@tanstack/react-router';
import { useProfile } from '@/features/profile/hooks/use-profile';
import { ProfileDetails } from '@/features/profile/components/profile-details';
import { RolesSection } from '@/features/profile/components/roles-section';
import { FinancialOverview } from '@/features/profile/components/financial-overview';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/lib/auth/context';
import { requireAuth } from '@/lib/auth/guards';

export const Route = createFileRoute('/profile')({
  beforeLoad: ({ context }) => {
    requireAuth(context.auth);
  },
  component: ProfilePage,
});

function ProfilePage() {
  const auth = useAuth();
  const { t } = useTranslation();
  const { financialSummary, isLoading: isFinancialLoading } = useProfile(!!auth.user);

  if (auth.isLoading || !auth.user) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <span className="animate-pulse text-muted-foreground text-sm font-medium">
          {t('profile.loading')}
        </span>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-12 max-w-4xl space-y-8">
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight text-foreground">
          {t('profile.title')}
        </h1>
        <p className="text-muted-foreground mt-2">{t('profile.desc')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ProfileDetails user={auth.user} />
        <RolesSection activeRole={auth.activeRole} roles={auth.roles} />
      </div>

      <FinancialOverview financialSummary={financialSummary} isLoading={isFinancialLoading} />
    </div>
  );
}
