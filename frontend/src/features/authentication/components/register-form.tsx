import { useState } from 'react';
import { useAuth } from '@/lib/auth/context';
import { useNavigate } from '@tanstack/react-router';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';

export function RegisterForm() {
  const { t } = useTranslation();
  const auth = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await auth.register({
        username,
        email,
        password,
        name: name || undefined,
      });
      navigate({ to: '/select-role' });
    } catch (err) {
      const error = err as { body?: { error?: string } };
      setError(error.body?.error || t('auth.registrationFailed'));
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
              className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1"
              htmlFor="username"
            >
              {t('auth.username')}
            </label>
            <Input
              id="username"
              name="username"
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={t('auth.chooseUsername')}
            />
          </div>
          <div>
            <label
              className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1"
              htmlFor="email"
            >
              {t('auth.emailAddress')}
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label
              className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1"
              htmlFor="name"
            >
              {t('auth.fullNameOptional')}
            </label>
            <Input
              id="name"
              name="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('auth.yourName')}
            />
          </div>
          <div>
            <label
              className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1"
              htmlFor="password"
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
              placeholder={t('auth.choosePassword')}
            />
          </div>
        </div>

        <div className="pt-2">
          <Button type="submit" disabled={loading} className="w-full cursor-pointer font-semibold">
            {loading ? t('auth.registering') : t('auth.register')}
          </Button>
        </div>
      </form>
    </div>
  );
}
