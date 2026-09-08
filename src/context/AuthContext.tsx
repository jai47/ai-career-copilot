import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { ApiError } from '../api/client';
import type { LoginResponse } from '../types';

const STORAGE_KEY = 'copilot_auth';

interface StoredAuth {
  token: string;
  user_id: string;
  name: string;
  email: string;
}

interface AuthContextValue {
  token: string | null;
  userName: string | null;
  userEmail: string | null;
  isAuthenticated: boolean;
  login: (response: LoginResponse) => void;
  logout: () => void;
  handleApiError: (err: unknown) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function loadStoredAuth(): StoredAuth | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredAuth;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<StoredAuth | null>(() => loadStoredAuth());

  const login = useCallback((response: LoginResponse) => {
    const stored: StoredAuth = {
      token: response.token,
      user_id: response.user_id,
      name: response.name,
      email: response.email,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    setAuth(stored);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setAuth(null);
  }, []);

  const handleApiError = useCallback(
    (err: unknown) => {
      if (err instanceof ApiError && err.code === 'AUTH_REQUIRED') {
        logout();
      }
    },
    [logout],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      token: auth?.token ?? null,
      userName: auth?.name ?? null,
      userEmail: auth?.email ?? null,
      isAuthenticated: Boolean(auth?.token),
      login,
      logout,
      handleApiError,
    }),
    [auth, login, logout, handleApiError],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
