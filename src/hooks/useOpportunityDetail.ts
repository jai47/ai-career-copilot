import { useState } from 'react';
import { getOpportunity } from '../api/opportunities';
import { useAsync } from './useAsync';

export function useOpportunityDetail(token: string | null) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const detail = useAsync(
    (signal) => {
      if (!token || !selectedId) return Promise.resolve(null);
      return getOpportunity(token, selectedId, signal);
    },
    [token, selectedId],
    Boolean(token && selectedId),
  );

  return { selectedId, setSelectedId, detail };
}
