import { useQuery } from '@tanstack/react-query';
import { getCurrentSellerStoreOptions } from '@/lib/api/generated/@tanstack/react-query.gen';
import { useAuth } from '@/lib/auth/context';

export function useSellerStore() {
  const auth = useAuth();

  const {
    data: store,
    isLoading: isStoreLoading,
    error: storeError,
  } = useQuery({
    ...getCurrentSellerStoreOptions(),
    retry: false,
    enabled: auth.activeRole === 'seller',
  });

  const err = storeError as {
    message?: string;
    status?: number;
    error?: string;
    body?: { error?: string };
  } | null;

  const isNotFoundError =
    !!err &&
    (err.message?.includes('404') ||
      err.status === 404 ||
      err.error === 'Store not found' ||
      err.error?.includes('not found') ||
      err.body?.error === 'Store not found');

  return {
    store,
    isStoreLoading,
    storeError,
    isNotFoundError,
  };
}
