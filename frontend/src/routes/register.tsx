import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useAuth } from '@/lib/auth/context';

export const Route = createFileRoute('/register')({
  component: RegisterPage,
});

function RegisterPage() {
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
      setError(
        error.body?.error || 'Registration failed. Try checking username/email availability.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 bg-card p-8 rounded-lg border border-border shadow-sm">
        <div>
          <h2 className="text-center text-3xl font-extrabold tracking-tight text-foreground">
            Create an account
          </h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Or{' '}
            <a href="/login" className="font-medium text-primary hover:underline">
              sign in to existing account
            </a>
          </p>
        </div>

        {error && (
          <div className="rounded-md bg-destructive/15 p-4 text-sm text-destructive border border-destructive/20">
            {error}
          </div>
        )}

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-3">
            <div>
              <label
                className="text-xs font-semibold text-muted-foreground uppercase"
                htmlFor="username"
              >
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm"
                placeholder="Choose a username"
              />
            </div>
            <div>
              <label
                className="text-xs font-semibold text-muted-foreground uppercase"
                htmlFor="email"
              >
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label
                className="text-xs font-semibold text-muted-foreground uppercase"
                htmlFor="name"
              >
                Full Name (Optional)
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm"
                placeholder="Your name"
              />
            </div>
            <div>
              <label
                className="text-xs font-semibold text-muted-foreground uppercase"
                htmlFor="password"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm"
                placeholder="Choose a password (min 8 chars)"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex w-full justify-center rounded-md bg-primary py-2.5 px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90 focus:outline-none disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Registering...' : 'Register'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
