import { useAuth } from '../../context/AuthContext';
import { useAsync } from '../../hooks/useAsync';
import { getSkillGapReports } from '../../api/reports';
import { LoadingState, ErrorState, EmptyState } from '../ui/AsyncStates';
import type { SkillGapPeriod } from '../../types';

export default function SkillGapTab() {
  const { token } = useAuth();

  const { data, loading, error, refetch } = useAsync(
    (signal) => {
      if (!token) return Promise.reject(new Error('Not authenticated'));
      return getSkillGapReports(token, signal);
    },
    [token],
    Boolean(token),
  );

  if (loading) return <LoadingState message="Loading skill gap reports…" />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;
  if (!data?.weekly && !data?.monthly) {
    return (
      <EmptyState message="No skill gap reports yet. Reports are generated on pipeline runs (weekly on Fridays, monthly on month-end)." />
    );
  }

  return (
    <div className="space-y-8">
      {data.weekly && <PeriodReport title="Weekly report" period={data.weekly} />}
      {data.monthly && <PeriodReport title="Monthly report" period={data.monthly} />}
    </div>
  );
}

function PeriodReport({ title, period }: { title: string; period: SkillGapPeriod }) {
  const skills = period.top_missing_skills ?? [];
  return (
    <section className="sophisticated-card p-6 rounded-xl space-y-4">
      <div className="flex flex-wrap justify-between gap-2">
        <h3 className="text-xs font-mono uppercase tracking-widest text-accent">{title}</h3>
        {period.period_start && period.period_end && (
          <span className="text-[10px] font-mono text-slate-400">
            {period.period_start} → {period.period_end}
          </span>
        )}
      </div>
      {period.total_jobs_analysed != null && (
        <p className="text-xs text-slate-500">
          Jobs analysed: {period.total_jobs_analysed}
        </p>
      )}
      {!skills.length ? (
        <p className="text-xs text-slate-400">No missing skills ranked for this period.</p>
      ) : (
        <table className="w-full text-xs font-mono">
          <thead>
            <tr className="text-slate-400 border-b border-line">
              <th className="text-left py-2">Skill</th>
              <th className="text-right py-2">Job count</th>
              <th className="text-right py-2">Avg score</th>
            </tr>
          </thead>
          <tbody>
            {skills.map((s) => (
              <tr key={s.skill} className="border-b border-line/50">
                <td className="py-2 text-ink">{s.skill}</td>
                <td className="py-2 text-right">{s.job_count}</td>
                <td className="py-2 text-right text-accent">{s.avg_score?.toFixed?.(1) ?? s.avg_score}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
