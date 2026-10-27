import { useState } from 'react';
import { useAuth } from '@/lib/auth/context';
import { useNavigate } from '@tanstack/react-router';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';

export function LoginForm() {
  const { t } = useTranslation();
  const auth = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await auth.login({ username, password });
      navigate({ to: '/select-role' });
    } catch (err) {
      const error = err as { body?: { error?: string } };
      setError(error.body?.error || t('auth.failedToSignIn'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-md bg-destructive-subtle p-4 text-xs text-destructive border border-destructive-subtle">
          {error}
        </div>
      )}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-3">
          <div>
            <label
              htmlFor="username"
              className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1"
            >
              {t('auth.usernameOrEmail')}
            </label>
            <Input
              id="username"
              name="username"
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={t('auth.usernameOrEmail')}
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1"
            >
              {t('auth.password')}
            </label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('auth.password')}
            />
          </div>
        </div>

        <div className="pt-2">
          <Button type="submit" disabled={loading} className="w-full cursor-pointer font-semibold">
            {loading ? t('auth.signingIn') : t('auth.signIn')}
          </Button>
        </div>
      </form>
    </div>
  );
}
