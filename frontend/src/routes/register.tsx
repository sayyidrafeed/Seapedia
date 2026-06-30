import { createFileRoute } from '@tanstack/react-router';
import { AuthCard } from '@/components/shared/auth-card';
import { RegisterForm } from '@/features/authentication/components/register-form';

export const Route = createFileRoute('/register')({
  component: RegisterPage,
});

function RegisterPage() {
  const loginLink = (
    <>
      Or{' '}
      <a href="/login" className="font-medium text-primary hover:underline">
        sign in to existing account
      </a>
    </>
  );

  return (
    <AuthCard title="Create an account" subtitle={loginLink}>
      <RegisterForm />
    </AuthCard>
  );
}
