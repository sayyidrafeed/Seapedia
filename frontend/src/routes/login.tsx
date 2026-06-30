import { createFileRoute } from '@tanstack/react-router';
import { AuthCard } from '@/components/shared/auth-card';
import { LoginForm } from '@/features/authentication/components/login-form';

export const Route = createFileRoute('/login')({
  component: LoginPage,
});

function LoginPage() {
  const registerLink = (
    <>
      Or{' '}
      <a href="/register" className="font-medium text-primary hover:underline">
        register a new account
      </a>
    </>
  );

  return (
    <AuthCard title="Sign in to your account" subtitle={registerLink}>
      <LoginForm />
    </AuthCard>
  );
}
