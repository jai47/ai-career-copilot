import { useAsync } from '../../hooks/useAsync';
import { getBillingUsage } from '../../api/billing';
import { useAuth } from '../../context/AuthContext';
import { LoadingState, ErrorState } from '../ui/AsyncStates';

export default function UsageTab() {
  const { token } = useAuth();
  const { data, loading, error, refetch } = useAsync(
    (signal) => {
      if (!token) return Promise.reject(new Error('Not authenticated'));
      return getBillingUsage(token, signal);
    },
    [token],
    Boolean(token),
  );

  if (loading) return <LoadingState message="Loading usage…" />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;
  if (!data) return null;

  const maxSpend = Math.max(1, ...data.series.map((p) => p.spent));
  const dailyPct = Math.min(
    100,
    Math.round((data.daily_generation_used / Math.max(1, data.daily_generation_limit)) * 100),
  );

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h3 className="text-sm font-medium text-ink">Token balance</h3>
        <p className="mt-1 text-[13px] text-muted">
          Pipeline runs and successful platform LLM calls spend app tokens. Failed LLM
          calls and bring-your-own keys are free.
        </p>
        <p className="mt-4 text-3xl font-mono text-ink tracking-tight">
          {data.token_balance.toLocaleString()}
          <span className="ml-2 text-sm text-muted font-sans">tokens</span>
        </p>
        <div className="mt-3 grid grid-cols-2 gap-3 text-xs font-mono">
          <div className="rounded-xl border border-line bg-soft/40 px-3 py-2">
            <p className="text-muted">Spent today</p>
            <p className="text-ink mt-0.5">{data.spent_today}</p>
          </div>
          <div className="rounded-xl border border-line bg-soft/40 px-3 py-2">
            <p className="text-muted">Rates</p>
            <p className="text-ink mt-0.5">
              pipeline {data.rates.pipeline_run_tokens} · LLM {data.rates.llm_call_tokens}
            </p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-ink">Daily generation limit</h3>
        <p className="mt-1 text-[13px] text-muted">
          {data.daily_generation_used} / {data.daily_generation_limit} LLM generations today
        </p>
        <div className="mt-2 h-2 rounded-full bg-soft overflow-hidden">
          <div
            className={`h-full rounded-full ${dailyPct >= 100 ? 'bg-red-500' : 'bg-accent'}`}
            style={{ width: `${dailyPct}%` }}
          />
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-ink">14-day spend</h3>
        <div className="mt-3 flex items-end gap-1 h-28">
          {data.series.map((point) => {
            const px = Math.max(4, Math.round((point.spent / maxSpend) * 96));
            return (
              <div key={point.date} className="flex-1 flex flex-col items-center justify-end gap-1 min-w-0 h-full">
                <div
                  className="w-full rounded-t bg-accent/80"
                  style={{ height: `${px}px` }}
                  title={`${point.date}: ${point.spent} tokens`}
                />
                <span className="text-[9px] font-mono text-muted truncate w-full text-center">
                  {point.date.slice(5)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-xl border border-line bg-soft/30 p-4">
        <h3 className="text-sm font-medium text-ink">Add tokens</h3>
        <p className="mt-1 text-[13px] text-muted">{data.request_tokens_hint}</p>
      </div>
    </div>
  );
}
