import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import { useAuth } from '@/lib/auth/context';
import { useOnboarding } from '@/features/authentication/hooks/use-onboarding';
import { OnboardingForm } from '@/features/authentication/components/onboarding-form';

export const Route = createFileRoute('/onboard')({
  component: OnboardPage,
});

function OnboardPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const onboarding = useOnboarding();

  useEffect(() => {
    // If not logged in, redirect to login
    if (!auth.isLoading && !auth.user) {
      navigate({ to: '/login' });
    }
    // If already onboarded, redirect to home
    if (!auth.isLoading && auth.user && auth.user.isOnboarded) {
      navigate({ to: '/' });
    }
  }, [auth.isLoading, auth.user, navigate]);

  if (auth.isLoading) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <span className="animate-pulse text-muted-foreground text-sm font-medium">
          Loading onboarding...
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
            Welcome to Seapedia, {welcomeName}!
          </h2>
          <p className="mt-1.5 text-xs text-muted-foreground">
            Let's customize your profile. Select what roles you want to have in this application.
          </p>
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
