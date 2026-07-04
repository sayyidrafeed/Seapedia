import { createFileRoute, redirect } from '@tanstack/react-router';
import { useAuth } from '@/lib/auth/context';
import { useOnboarding } from '@/features/authentication/hooks/use-onboarding';
import { OnboardingForm } from '@/features/authentication/components/onboarding-form';
import { useTranslation } from 'react-i18next';
import { requireAuth } from '@/lib/auth/guards';

export const Route = createFileRoute('/onboard')({
  beforeLoad: ({ context }) => {
    requireAuth(context.auth);
    if (!context.auth.isLoading && context.auth.user && context.auth.user.isOnboarded) {
      throw redirect({ to: '/' });
    }
  },
  component: OnboardPage,
});

function OnboardPage() {
  const { t } = useTranslation();
  const auth = useAuth();
  const onboarding = useOnboarding();

  if (auth.isLoading) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <span className="animate-pulse text-muted-foreground text-sm font-medium">
          {t('onboard.loading')}
        </span>
      </div>
    );
  }

  const welcomeName = (auth.user?.name as string) || auth.user?.username;

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12 bg-background">
      <div className="w-full max-w-lg space-y-6 bg-card p-8 rounded-xl border border-border shadow-surface">
        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            {t('onboard.welcome', { name: welcomeName })}
          </h2>
          <p className="mt-1.5 text-xs text-muted-foreground">{t('onboard.instruction')}</p>
        </div>

        <OnboardingForm
          selectedRoles={onboarding.selectedRoles}
          isSubmitting={onboarding.isSubmitting}
          error={onboarding.error}
          onToggleRole={onboarding.handleToggleRole}
          onSubmit={onboarding.handleOnboard}
        />
      </div>
    </div>
  );
}
