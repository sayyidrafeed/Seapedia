import { createFileRoute } from '@tanstack/react-router';
import { AuthCard } from '@/components/shared/auth-card';
import { RegisterForm } from '@/features/authentication/components/register-form';
import { useTranslation } from 'react-i18next';

export const Route = createFileRoute('/register')({
  component: RegisterPage,
});

function RegisterPage() {
  const { t } = useTranslation();
  const loginLink = (
    <>
      {t('auth.or')}{' '}
      <a href="/login" className="font-medium text-primary hover:underline">
        {t('auth.signInExistingAccount')}
      </a>
    </>
  );

  return (
    <AuthCard title={t('auth.createAccountTitle')} subtitle={loginLink}>
      <RegisterForm />
    </AuthCard>
  );
}
