import { useState } from 'react';
import { Play, Loader2, Square, RotateCcw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';
import { useAsync } from '../hooks/useAsync';
import { usePipelinePolling } from '../hooks/usePipelinePolling';
import {
  getPipelineRuns,
  triggerPipelineRun,
  cancelPipelineRun,
  continuePipelineRun,
} from '../api/pipeline';
import { ApiError } from '../api/client';
import {
  PIPELINE_STAGE_LABELS,
  PIPELINE_STAGE_ORDER,
  type PipelineProgressEntry,
  type PipelineRunResponse,
} from '../types';
import { ErrorState, LoadingState } from '../components/ui/AsyncStates';

export default function PipelineStatus() {
  const { token } = useAuth();
  const { profile } = useProfile();
  const [trackedRunId, setTrackedRunId] = useState<string | null>(null);
  const [triggerError, setTriggerError] = useState<string | null>(null);
  const [triggering, setTriggering] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const history = useAsync(
    (signal) => {
      if (!token) return Promise.reject(new Error('Not authenticated'));
      return getPipelineRuns(token, signal).then((r) => r.runs);
    },
    [token],
    Boolean(token),
  );

  const { run: activeRun } = usePipelinePolling(token, trackedRunId, () => {
    history.refetch();
    setTrackedRunId(null);
  });

  const displayRun: PipelineRunResponse | null =
    activeRun ?? history.data?.[0] ?? null;

  const handleRun = async () => {
    if (!token || !profile?.has_active_resume) return;
    setTriggering(true);
    setTriggerError(null);
    try {
      const run = await triggerPipelineRun(token);
      setTrackedRunId(run.id);
      history.refetch();
    } catch (err) {
      setTriggerError(err instanceof ApiError ? err.message : 'Failed to start pipeline');
    } finally {
      setTriggering(false);
    }
  };

  const handleContinue = async () => {
    if (!token || !profile?.has_active_resume) return;
    setTriggering(true);
    setTriggerError(null);
    try {
      const run = await continuePipelineRun(token);
      setTrackedRunId(run.id);
      history.refetch();
    } catch (err) {
      setTriggerError(err instanceof ApiError ? err.message : 'Failed to continue pipeline');
    } finally {
      setTriggering(false);
    }
  };

  const handleCancel = async () => {
    if (!token) return;
    setCancelling(true);
    setTriggerError(null);
    try {
      const run = await cancelPipelineRun(token);
      setTrackedRunId(run.id);
      history.refetch();
    } catch (err) {
      setTriggerError(err instanceof ApiError ? err.message : 'Failed to stop pipeline');
    } finally {
      setCancelling(false);
    }
  };

  if (history.loading && !displayRun) return <LoadingState message="Loading pipeline status…" />;

  const isRunning = displayRun?.status === 'running';
  const canContinue =
    Boolean(profile?.has_active_resume) &&
    !isRunning &&
    (displayRun?.status === 'failed' || displayRun?.status === 'cancelled');
  const continueStage =
    displayRun?.error_stage ||
    (displayRun?.current_stage && displayRun.current_stage !== 'complete'
      ? displayRun.current_stage
      : null);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="page-title">Pipeline.</h1>
        <p className="page-subtitle">Run discovery and review the latest status.</p>
      </div>

      {!profile?.has_active_resume && (
        <div className="text-[14px] text-[#8a6d00] bg-[#fff9eb] border border-[#f0d78c] px-4 py-3 rounded-[12px]">
          Upload a resume in Settings before running the pipeline.
        </div>
      )}
      {!profile?.parsed_skills?.length && profile?.has_active_resume && (
        <div className="text-[14px] text-[#8a6d00] bg-[#fff9eb] border border-[#f0d78c] px-4 py-3 rounded-[12px]">
          No parsed skills found — re-upload your resume in Settings.
        </div>
      )}

      {triggerError && (
        <div className="text-[14px] text-[#b00020] bg-[#fff2f2] border border-[#f5c2c2] px-4 py-3 rounded-[12px]">
          {triggerError}
        </div>
      )}

      {canContinue && (
        <div className="text-[14px] text-[#8a6d00] bg-[#fff9eb] border border-[#f0d78c] px-4 py-3 rounded-[12px]">
          Last run {displayRun?.status}
          {continueStage
            ? ` at “${PIPELINE_STAGE_LABELS[continueStage as keyof typeof PIPELINE_STAGE_LABELS] ?? continueStage}”`
            : ''}
          . Tokens are not charged for failed runs — you can continue from where it stopped.
        </div>
      )}

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          disabled={triggering || isRunning || !profile?.has_active_resume}
          onClick={() => void handleRun()}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent hover:bg-accent-hover text-white text-[14px] font-medium rounded-full cursor-pointer disabled:opacity-50"
        >
          {triggering || isRunning ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Play className="w-4 h-4" />
          )}
          {isRunning ? 'Pipeline running…' : 'Run pipeline now'}
        </button>
        {canContinue && (
          <button
            type="button"
            disabled={triggering || isRunning}
            onClick={() => void handleContinue()}
            className="inline-flex items-center gap-2 px-5 py-2.5 border border-accent/40 text-accent text-[14px] font-medium rounded-full cursor-pointer disabled:opacity-50"
          >
            {triggering ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RotateCcw className="w-4 h-4" />
            )}
            Continue from failure
          </button>
        )}
        {isRunning && (
          <button
            type="button"
            disabled={cancelling}
            onClick={() => void handleCancel()}
            className="inline-flex items-center gap-2 px-5 py-2.5 border border-amber-500/50 text-amber-700 text-[14px] font-medium rounded-xl cursor-pointer disabled:opacity-50"
          >
            {cancelling ? <Loader2 className="w-4 h-4 animate-spin" /> : <Square className="w-4 h-4" />}
            Stop pipeline
          </button>
        )}
        {displayRun && (
          <span className="text-xs font-mono text-slate-400">
            Last run: {displayRun.run_date} — {displayRun.status ?? 'unknown'}
          </span>
        )}
      </div>

      {displayRun && (
        <>
          <StageStepper currentStage={displayRun.current_stage} />
          <MetricsGrid run={displayRun} />
          <ProgressLog entries={displayRun.progress_log} />
        </>
      )}

      <section>
        <h3 className="text-xs font-mono uppercase tracking-widest text-accent mb-4">
          Run history
        </h3>
        {history.error ? (
          <ErrorState message={history.error} onRetry={history.refetch} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="text-slate-400 border-b border-line">
                  <th className="text-left py-2 pr-4">Date</th>
                  <th className="text-left py-2 pr-4">Status</th>
                  <th className="text-right py-2 pr-4">Discovered</th>
                  <th className="text-right py-2 pr-4">Scored</th>
                  <th className="text-right py-2">Top</th>
                </tr>
              </thead>
              <tbody>
                {history.data?.map((run) => (
                  <tr
                    key={run.id}
                    className={`border-b border-line/50 ${
                      run.status === 'failed'
                        ? 'text-red-600/80'
                        : run.status === 'cancelled'
                          ? 'text-amber-300/80'
                          : ''
                    }`}
                  >
                    <td className="py-2 pr-4">{run.run_date}</td>
                    <td className="py-2 pr-4">{run.status}</td>
                    <td className="py-2 pr-4 text-right">{run.jobs_discovered}</td>
                    <td className="py-2 pr-4 text-right">{run.jobs_scored}</td>
                    <td className="py-2 text-right">{run.top_opportunities}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function StageStepper({ currentStage }: { currentStage: string | null }) {
  const currentIdx = currentStage
    ? PIPELINE_STAGE_ORDER.indexOf(currentStage as (typeof PIPELINE_STAGE_ORDER)[number])
    : -1;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-2">
      {PIPELINE_STAGE_ORDER.map((stage, idx) => {
        const done = currentIdx > idx;
        const active = currentStage === stage;
        return (
          <div
            key={stage}
            className={`p-2 rounded-xl border text-center text-[13px] font-medium ${
              active
                ? 'border-accent bg-accent/10 text-accent'
                : done
                  ? 'border-emerald-500/30 text-emerald-700/80'
                  : 'border-line text-slate-400'
            }`}
          >
            {PIPELINE_STAGE_LABELS[stage]}
          </div>
        );
      })}
    </div>
  );
}

function MetricsGrid({ run }: { run: PipelineRunResponse }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <Stat label="Discovered" value={String(run.jobs_discovered)} />
      <Stat label="After dedup" value={String(run.jobs_after_dedup)} />
      <Stat label="Scored" value={String(run.jobs_scored)} />
      <Stat label="Top opportunities" value={String(run.top_opportunities)} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="sophisticated-card p-3 rounded-xl">
      <p className="text-[13px] font-medium text-slate-400">{label}</p>
      <p className="text-lg font-semibold tracking-[-0.02em] text-accent mt-1">{value}</p>
    </div>
  );
}

function ProgressLog({ entries }: { entries: PipelineProgressEntry[] }) {
  if (!entries.length) return null;
  const recent = entries.slice(-50);
  return (
    <div className="sophisticated-card p-4 rounded-xl">
      <h3 className="text-xs font-mono uppercase tracking-widest text-accent mb-3">
        Progress log
      </h3>
      <pre className="text-[10px] font-mono max-h-64 overflow-y-auto whitespace-pre-wrap leading-relaxed">
        {recent.map((e, i) => (
          <span
            key={`${e.ts}-${i}`}
            className={
              e.level === 'error'
                ? 'text-red-600'
                : e.level === 'warn'
                  ? 'text-amber-700'
                  : 'text-slate-600'
            }
          >
            [{e.ts}] {e.stage}: {e.message}
            {'\n'}
          </span>
        ))}
      </pre>
    </div>
  );
}
