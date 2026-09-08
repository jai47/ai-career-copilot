import { useAuth } from '../context/AuthContext';
import { useAsync } from '../hooks/useAsync';
import { getApplicationAnalytics } from '../api/reports';
import { EmptyState, ErrorState, LoadingState } from './ui/AsyncStates';
import PatternsPanel from './PatternsPanel';

function BarRow({
  label,
  applications,
  responses,
  rate,
}: {
  label: string;
  applications: number;
  responses: number;
  rate: number;
}) {
  const pct = Math.round(rate * 100);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-slate-600 capitalize">{label.replace(/_/g, ' ')}</span>
        <span className="text-muted font-mono">
          {responses}/{applications} · {pct}%
        </span>
      </div>
      <div className="h-1.5 bg-soft rounded-xl overflow-hidden">
        <div
          className="h-full bg-accent/70 rounded-xl transition-all"
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
    </div>
  );
}

function BucketSection({
  title,
  buckets,
}: {
  title: string;
  buckets: { key: string; applications: number; responses: number; rate: number }[];
}) {
  if (!buckets.length) return null;
  return (
    <div className="border border-line rounded-xl p-4 space-y-3">
      <h3 className="text-[14px] font-medium text-accent">{title}</h3>
      {buckets.map((b) => (
        <BarRow key={b.key} label={b.key} {...b} />
      ))}
    </div>
  );
}

export default function ApplicationAnalytics() {
  const { token } = useAuth();
  const { data, loading, error, refetch } = useAsync(
    (signal) => {
      if (!token) return Promise.reject(new Error('Not authenticated'));
      return getApplicationAnalytics(token, undefined, signal);
    },
    [token],
    Boolean(token),
  );

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;
  if (!data) return <EmptyState message="No analytics data." />;

  if ('required' in data) {
    const remaining = data.required - data.qualifying_applications;
    return (
      <div className="space-y-8">
        <div>
          <h1 className="page-title">Analytics.</h1>
          <p className="page-subtitle">Response rates unlock after enough applied roles.</p>
        </div>
        <div className="max-w-lg sophisticated-card p-8 space-y-4">
          <h3 className="text-[17px] font-semibold tracking-[-0.02em] text-ink">Analytics locked</h3>
          <p className="text-[15px] text-muted leading-relaxed">
            Mark at least <strong className="text-ink">{data.required}</strong> applications as{' '}
            <em>Applied</em> to unlock response-rate analytics.
          </p>
          <p className="text-[14px] text-muted">
            Progress: {data.qualifying_applications} / {data.required}
            {remaining > 0 && ` — ${remaining} more needed`}
          </p>
          <div className="h-1.5 bg-soft rounded-full overflow-hidden">
            <div
              className="h-full bg-accent rounded-full"
              style={{ width: `${(data.qualifying_applications / data.required) * 100}%` }}
            />
          </div>
        </div>
        <div data-coach-id="analytics-patterns">
          <PatternsPanel />
        </div>
      </div>
    );
  }

  const stats = data;

  const overallPct = Math.round(stats.response_rate_overall * 100);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="page-title">Analytics.</h1>
        <p className="page-subtitle">
          Based on {stats.qualifying_applications} submitted applications. Response means any move
          out of Applied.
        </p>
      </div>

      <div data-coach-id="analytics-patterns">
        <PatternsPanel />
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <div className="border border-line rounded-xl p-4">
          <p className="text-[13px] font-medium text-muted font-mono">Overall response rate</p>
          <p className="text-3xl font-semibold tracking-[-0.02em] text-accent mt-1">{overallPct}%</p>
        </div>
        <div className="border border-line rounded-xl p-4">
          <p className="text-[13px] font-medium text-muted font-mono">Median days to response</p>
          <p className="text-3xl font-semibold tracking-[-0.02em] text-ink mt-1">
            {stats.days_to_first_response.p50 ?? '—'}
          </p>
        </div>
        <div className="border border-line rounded-xl p-4">
          <p className="text-[13px] font-medium text-muted font-mono">P90 days to response</p>
          <p className="text-3xl font-semibold tracking-[-0.02em] text-ink mt-1">
            {stats.days_to_first_response.p90 ?? '—'}
          </p>
          <p className="text-[9px] text-slate-400 mt-1">
            n={stats.days_to_first_response.sample_size}
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <BucketSection title="By country" buckets={stats.by_country} />
        <BucketSection title="By archetype" buckets={stats.by_archetype} />
        <BucketSection title="By score band" buckets={stats.by_score_band} />
      </div>

      {stats.excluded_pre_event_log > 0 && (
        <p className="text-[10px] text-muted">
          {stats.excluded_pre_event_log} application(s) excluded from time-to-response metrics
          (pre-event-log).
        </p>
      )}
    </div>
  );
}
