import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  getCurrentUser,
  getCurrentSession,
  loginUser,
  registerUser,
  logoutUser,
  selectActiveRole,
} from '@/lib/api/generated/sdk.gen';
import type {
  GetCurrentUserResponses,
  GetCurrentSessionResponses,
} from '@/lib/api/generated/types.gen';

export type UserType = GetCurrentUserResponses[200];
export type SessionType = GetCurrentSessionResponses[200];

type AuthContextType = {
  user: UserType | null;
  session: SessionType | null;
  activeRole: string | null;
  roles: string[];
  isLoading: boolean;
  register: (body: Parameters<typeof registerUser>[0]['body']) => Promise<void>;
  login: (body: Parameters<typeof loginUser>[0]['body']) => Promise<void>;
  logout: () => Promise<void>;
  selectRole: (role: 'admin' | 'seller' | 'buyer' | 'driver') => Promise<void>;
  refetchSession: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserType | null>(null);
  const [session, setSession] = useState<SessionType | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAuth = async () => {
    try {
      const userRes = await getCurrentUser({ throwOnError: true });
      const sessionRes = await getCurrentSession({ throwOnError: true });
      setUser(userRes.data || null);
      setSession(sessionRes.data || null);
    } catch {
      setUser(null);
      setSession(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAuth();
  }, []);

  const handleRegister = async (body: Parameters<typeof registerUser>[0]['body']) => {
    setIsLoading(true);
    try {
      await registerUser({ body, throwOnError: true });
      await fetchAuth();
    } catch (e) {
      setIsLoading(false);
      throw e;
    }
  };

  const handleLogin = async (body: Parameters<typeof loginUser>[0]['body']) => {
    setIsLoading(true);
    try {
      await loginUser({ body, throwOnError: true });
      await fetchAuth();
    } catch (e) {
      setIsLoading(false);
      throw e;
    }
  };

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await logoutUser({ throwOnError: true });
      setUser(null);
      setSession(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectRole = async (role: 'admin' | 'seller' | 'buyer' | 'driver') => {
    setIsLoading(true);
    try {
      await selectActiveRole({ body: { role }, throwOnError: true });
      await fetchAuth();
    } catch (e) {
      setIsLoading(false);
      throw e;
    }
  };

  const activeRole = session?.activeRole || null;
  const roles = session?.roles || [];

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        activeRole,
        roles,
        isLoading,
        register: handleRegister,
        login: handleLogin,
        logout: handleLogout,
        selectRole: handleSelectRole,
        refetchSession: fetchAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
