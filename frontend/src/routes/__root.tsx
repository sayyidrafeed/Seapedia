import {
  createRootRoute,
  Outlet,
  ScrollRestoration,
  useNavigate,
  useLocation,
} from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import { useAuth } from '@/lib/auth/context';
import { useEffect } from 'react';
import { Navbar } from '@/components/shared/navbar';
import { Footer } from '@/components/shared/footer';

function RootComponent() {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  useEffect(() => {
    if (
      !auth.isLoading &&
      auth.user &&
      !auth.user.isOnboarded &&
      !auth.roles.includes('admin') &&
      location.pathname !== '/onboard'
    ) {
      navigate({ to: '/onboard' });
    }
  }, [auth.user, auth.isLoading, auth.roles, location.pathname, navigate]);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      <Navbar />

      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>

      <Footer />

      <ScrollRestoration />
      {import.meta.env.DEV ? <TanStackRouterDevtools /> : null}
    </div>
  );
}

export const Route = createRootRoute({
  component: RootComponent,
});
