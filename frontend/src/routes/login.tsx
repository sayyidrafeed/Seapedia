import { createFileRoute } from '@tanstack/react-router';
import { AuthCard } from '@/components/shared/auth-card';
import { LoginForm } from '@/features/authentication/components/login-form';
import { useTranslation } from 'react-i18next';

export const Route = createFileRoute('/login')({
  component: LoginPage,
});

function LoginPage() {
  const { t } = useTranslation();
  const registerLink = (
    <>
      {t('auth.or')}{' '}
      <a href="/register" className="font-medium text-primary hover:underline">
        {t('auth.registerNewAccount')}
      </a>
    </>
  );

  return (
    <AuthCard title={t('auth.signInTitle')} subtitle={registerLink}>
      <LoginForm />
    </AuthCard>
  );
}
