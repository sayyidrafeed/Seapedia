import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import { useAuth } from '@/lib/auth/context';
import { Logo } from '@/components/shared/logo';
import { SelectRolePanel } from '@/features/authentication/components/select-role-panel';
import { useTranslation } from 'react-i18next';

export const Route = createFileRoute('/select-role')({
  component: SelectRolePage,
});

function SelectRolePage() {
  const { t } = useTranslation();
  const auth = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!auth.isLoading && !auth.user) {
      navigate({ to: '/login' });
    } else if (!auth.isLoading && auth.roles.length === 1) {
      const singleRole = auth.roles[0];
      auth.selectRole(singleRole as 'admin' | 'seller' | 'buyer' | 'driver').then(() => {
        navigate({ to: `/dashboard/${singleRole}` });
      });
    }
  }, [auth.isLoading, auth.user, auth.roles, navigate]);

  if (auth.isLoading) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <span className="animate-pulse text-muted-foreground text-sm font-medium">
          {t('selectRole.checkingSession')}
        </span>
      </div>
    );
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6 bg-card p-8 rounded-xl border border-border shadow-surface text-center">
        <div className="flex flex-col items-center">
          <Logo variant="wordmark" size="lg" className="mb-4" />
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            {t('selectRole.title')}
          </h2>
          <p className="mt-1.5 text-xs text-muted-foreground">{t('selectRole.subtitle')}</p>
        </div>

        <SelectRolePanel />
      </div>
    </div>
  );
}
