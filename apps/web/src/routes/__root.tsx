import { createRootRouteWithContext, Outlet, redirect } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import { useAuth } from '@/lib/auth/context';
import { GlobalNavbar } from '@/components/shared/global-navbar';
import { Footer } from '@/components/shared/footer';
import { Toaster } from 'sonner';
import { QueryClient } from '@tanstack/react-query';

interface MyRouterContext {
  auth: ReturnType<typeof useAuth>;
  queryClient: QueryClient;
}

function RootComponent() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      <GlobalNavbar />

      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>

      <Footer />

      <Toaster richColors position="top-center" closeButton />

      {import.meta.env.DEV ? <TanStackRouterDevtools /> : null}
    </div>
  );
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  beforeLoad: ({ context, location }) => {
    const { auth } = context;
    if (
      !auth.isLoading &&
      auth.user &&
      !auth.user.isOnboarded &&
      !auth.roles.includes('admin') &&
      location.pathname !== '/onboard'
    ) {
      throw redirect({ to: '/onboard' });
    }
  },
  component: RootComponent,
});
