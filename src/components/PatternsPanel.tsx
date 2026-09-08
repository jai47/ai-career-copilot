import { useAuth } from '../context/AuthContext';
import { useAsync } from '../hooks/useAsync';
import { getPatterns } from '../api/autopilot';
import { EmptyState, ErrorState, LoadingState } from './ui/AsyncStates';

export default function PatternsPanel() {
  const { token } = useAuth();
  const patterns = useAsync(
    (signal) => {
      if (!token) return Promise.reject(new Error('Not authenticated'));
      return getPatterns(token, false, signal);
    },
    [token],
    Boolean(token),
  );

  if (patterns.loading && !patterns.data) return <LoadingState message="Loading patterns…" />;
  if (patterns.error) return <ErrorState message={patterns.error} onRetry={patterns.refetch} />;
  if (!patterns.data) return <EmptyState message="No pattern data yet." />;

  const data = patterns.data;

  return (
    <section className="sophisticated-card p-6 space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-[17px] font-semibold tracking-[-0.02em]">Targeting patterns</h3>
          <p className="text-[14px] text-muted mt-1">
            From {data.total_opportunities} scored roles and {data.total_applications} applications.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            if (!token) return;
            void getPatterns(token, true).then(() => patterns.refetch());
          }}
          className="text-[14px] font-medium text-accent hover:underline"
        >
          Refresh summary
        </button>
      </div>

      {data.summary && <p className="text-[15px] text-ink leading-relaxed">{data.summary}</p>}

      <div className="space-y-3">
        {data.insights.map((insight) => (
          <div
            key={insight.kind + insight.title}
            className={`px-4 py-3 rounded-[12px] border text-[14px] ${
              insight.severity === 'warn'
                ? 'bg-[#fff9eb] border-[#f0d78c] text-[#8a6d00]'
                : 'bg-soft border-line text-ink'
            }`}
          >
            <p className="font-medium">{insight.title}</p>
            <p className="text-muted mt-1">{insight.detail}</p>
          </div>
        ))}
      </div>

      {data.reject_reasons.length > 0 && (
        <div>
          <p className="section-label mb-2">Reject reasons</p>
          <ul className="flex flex-wrap gap-2">
            {data.reject_reasons.map((r) => (
              <li
                key={r.key}
                className="px-3 py-1 text-[13px] rounded-full bg-soft border border-line text-muted"
              >
                {r.label} · {r.count}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
