import { redirect } from '@tanstack/react-router';
import { useAuth } from '@/lib/auth/context';

type AuthContextType = ReturnType<typeof useAuth>;

export function requireAuth(auth: AuthContextType) {
  if (!auth.isLoading && !auth.user) {
    throw redirect({ to: '/login' });
  }
}

export function requireDashboardRole(
  auth: AuthContextType,
  role: 'admin' | 'seller' | 'buyer' | 'driver',
) {
  requireAuth(auth);

  if (!auth.isLoading && auth.activeRole !== role) {
    if (auth.activeRole) {
      throw redirect({
        to: `/dashboard/${auth.activeRole}` as
          | '/dashboard/admin'
          | '/dashboard/seller'
          | '/dashboard/buyer'
          | '/dashboard/driver',
      });
    } else {
      throw redirect({ to: '/select-role' });
    }
  }
}
