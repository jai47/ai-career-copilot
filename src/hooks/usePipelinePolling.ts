import { useCallback, useEffect, useRef, useState } from 'react';
import { getPipelineRuns } from '../api/pipeline';
import type { PipelineRunResponse } from '../types';

const POLL_INTERVAL_MS = 3000;

export function usePipelinePolling(
  token: string | null,
  trackedRunId: string | null,
  onComplete?: (run: PipelineRunResponse) => void,
): {
  run: PipelineRunResponse | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
} {
  const [run, setRun] = useState<PipelineRunResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const completedRef = useRef(false);

  const fetchRuns = useCallback(
    async (signal: AbortSignal) => {
      if (!token) return;
      setLoading(true);
      try {
        const { runs } = await getPipelineRuns(token, signal);
        const match = trackedRunId
          ? (runs.find((r) => r.id === trackedRunId) ?? runs[0] ?? null)
          : (runs[0] ?? null);
        setRun(match);
        setError(null);

        if (match && match.status !== 'running' && !completedRef.current && trackedRunId) {
          completedRef.current = true;
          onCompleteRef.current?.(match);
        }
      } catch (err) {
        if (!signal.aborted) {
          setError(err instanceof Error ? err.message : 'Failed to load pipeline runs');
        }
      } finally {
        if (!signal.aborted) setLoading(false);
      }
    },
    [token, trackedRunId],
  );

  const refresh = useCallback(() => {
    const controller = new AbortController();
    void fetchRuns(controller.signal);
    return () => controller.abort();
  }, [fetchRuns]);

  useEffect(() => {
    if (!token) return;
    completedRef.current = false;
    const controller = new AbortController();
    void fetchRuns(controller.signal);

    const shouldPoll = Boolean(trackedRunId) || run?.status === 'running';
    const interval = shouldPoll
      ? window.setInterval(() => void fetchRuns(controller.signal), POLL_INTERVAL_MS)
      : undefined;

    return () => {
      controller.abort();
      if (interval) window.clearInterval(interval);
    };
  }, [token, trackedRunId, fetchRuns, run?.status]);

  return { run, loading, error, refresh };
}
