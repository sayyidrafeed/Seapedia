import { useState } from 'react';
import { useAuth } from '@/lib/auth/context';
import { useNavigate } from '@tanstack/react-router';
import { onboardUser } from '@/lib/api/generated/sdk.gen';

export function useOnboarding() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [selectedRoles, setSelectedRoles] = useState<string[]>(['buyer']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleToggleRole = (role: string) => {
    if (role === 'buyer') return; // Buyer is mandatory
    if (selectedRoles.includes(role)) {
      setSelectedRoles(selectedRoles.filter((r) => r !== role));
    } else {
      setSelectedRoles([...selectedRoles, role]);
    }
  };

  const handleOnboard = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      await onboardUser({
        body: {
          roles: selectedRoles as ('buyer' | 'seller' | 'driver')[],
        },
        throwOnError: true,
      });
      await auth.refetchSession();
      if (selectedRoles.includes('seller')) {
        navigate({ to: '/dashboard/seller/onboarding' });
      } else {
        navigate({ to: '/' });
      }
    } catch (err) {
      const msg =
        err && typeof err === 'object' && 'message' in err && typeof err.message === 'string'
          ? err.message
          : 'Failed to complete onboarding';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    selectedRoles,
    isSubmitting,
    error,
    handleToggleRole,
    handleOnboard,
  };
}
