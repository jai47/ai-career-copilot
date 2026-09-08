import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { getProfile } from '../api/users';
import { ApiError } from '../api/client';
import { useAuth } from './AuthContext';
import type { UserProfileResponse } from '../types';

interface ProfileContextValue {
  profile: UserProfileResponse | null;
  loading: boolean;
  error: string | null;
  refetchProfile: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { token, isAuthenticated, logout } = useAuth();
  const [profile, setProfile] = useState<UserProfileResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetchProfile = useCallback(async () => {
    if (!token) {
      setProfile(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await getProfile(token);
      setProfile(data);
    } catch (err) {
      if (err instanceof ApiError && err.code === 'AUTH_REQUIRED') {
        logout();
      } else {
        setError(err instanceof Error ? err.message : 'Failed to load profile');
      }
    } finally {
      setLoading(false);
    }
  }, [token, logout]);

  useEffect(() => {
    if (isAuthenticated && token) {
      void refetchProfile();
    } else {
      setProfile(null);
    }
  }, [isAuthenticated, token, refetchProfile]);

  const value = useMemo(
    () => ({ profile, loading, error, refetchProfile }),
    [profile, loading, error, refetchProfile],
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile(): ProfileContextValue {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile must be used within ProfileProvider');
  return ctx;
}
