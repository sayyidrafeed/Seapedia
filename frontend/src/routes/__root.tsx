import {
  createRootRoute,
  Link,
  Outlet,
  ScrollRestoration,
  useNavigate,
  useLocation,
} from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import { useAuth } from '@/lib/auth/context';
import { useState, useEffect } from 'react';

function RootComponent() {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showDashboardDropdown, setShowDashboardDropdown] = useState(false);

  useEffect(() => {
    if (
      !auth.isLoading &&
      auth.user &&
      !auth.user.isOnboarded &&
      location.pathname !== '/onboard'
    ) {
      navigate({ to: '/onboard' });
    }
  }, [auth.user, auth.isLoading, location.pathname, navigate]);

  const handleLogout = async () => {
    await auth.logout();
    navigate({ to: '/' });
  };

  const handleSelectRoleAndNavigate = async (role: string) => {
    try {
      await auth.selectRole(role as 'admin' | 'seller' | 'buyer' | 'driver');
      navigate({ to: `/dashboard/${role}` });
      setShowDashboardDropdown(false);
    } catch {
      // ignore
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-6">
            <Link
              to="/"
              className="text-2xl font-bold tracking-tight text-primary transition-colors hover:text-primary/95"
            >
              Seapedia
            </Link>
            <nav className="hidden md:flex items-center gap-4 text-sm font-medium">
              <Link to="/" className="transition-colors hover:text-foreground/80 text-foreground">
                Home
              </Link>
              <Link
                to="/profile"
                className="transition-colors hover:text-foreground/80 text-foreground flex items-center gap-1"
              >
                Profile
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            {auth.isLoading ? (
              <span className="text-xs text-muted-foreground animate-pulse">Loading auth...</span>
            ) : auth.user ? (
              <div className="flex items-center gap-4">
                <span className="hidden sm:inline text-sm font-medium text-muted-foreground">
                  Logged in as <strong className="text-foreground">{auth.user.username}</strong>
                </span>

                {auth.activeRole && (
                  <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary capitalize">
                    {auth.activeRole}
                  </span>
                )}

                {auth.roles.length > 1 && (
                  <Link
                    to="/select-role"
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    Switch Role
                  </Link>
                )}

                {auth.activeRole &&
                  (auth.roles.length > 1 ? (
                    <div className="relative">
                      <button
                        onClick={() => setShowDashboardDropdown(!showDashboardDropdown)}
                        className="text-xs font-medium hover:underline text-muted-foreground flex items-center gap-1 cursor-pointer bg-transparent border-none p-0"
                      >
                        Dashboard <span className="text-[10px]">▼</span>
                      </button>
                      {showDashboardDropdown && (
                        <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-card border border-border py-1 z-50">
                          {auth.roles.map((role) => (
                            <button
                              key={role}
                              onClick={() => handleSelectRoleAndNavigate(role)}
                              className={`w-full text-left px-4 py-2 text-xs hover:bg-accent/50 capitalize block cursor-pointer bg-transparent border-none ${
                                auth.activeRole === role
                                  ? 'font-bold text-primary'
                                  : 'text-foreground'
                              }`}
                            >
                              {role} Dashboard
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <Link
                      to={`/dashboard/${auth.activeRole}` as unknown as '/dashboard/admin'}
                      className="text-xs font-medium hover:underline text-muted-foreground"
                    >
                      Dashboard
                    </Link>
                  ))}

                <button
                  onClick={handleLogout}
                  className="rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/90 px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="text-xs font-medium hover:text-foreground/80 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="rounded-md bg-primary text-primary-foreground hover:bg-primary/90 px-3 py-1.5 text-xs font-medium transition-colors"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-border bg-card py-6">
        <div className="container mx-auto px-6 text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} Seapedia Marketplace. Evolved from edge-native to
          self-hosted Monorepo.
        </div>
      </footer>

      <ScrollRestoration />
      {import.meta.env.DEV ? <TanStackRouterDevtools /> : null}
    </div>
  );
}

export const Route = createRootRoute({
  component: RootComponent,
});
