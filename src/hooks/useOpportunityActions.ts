import { useCallback, useState } from 'react';
import { ApiError } from '../api/client';

export function useOpportunityActions(onSuccess?: () => void) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const runAction = useCallback(
    async (id: string, action: () => Promise<unknown>) => {
      setBusyId(id);
      setActionError(null);
      try {
        await action();
        onSuccess?.();
      } catch (err) {
        setActionError(err instanceof ApiError ? err.message : 'Action failed');
      } finally {
        setBusyId(null);
      }
    },
    [onSuccess],
  );

  return { busyId, actionError, runAction, setActionError };
}
