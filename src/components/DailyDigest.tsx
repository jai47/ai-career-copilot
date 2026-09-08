import { useCallback, useState } from 'react';
import { Download } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';
import { useAsync } from '../hooks/useAsync';
import { useOpportunityActions } from '../hooks/useOpportunityActions';
import { useOpportunityDetail } from '../hooks/useOpportunityDetail';
import { getTodayDigest } from '../api/digest';
import { approveOpportunity, listOpportunities, rejectOpportunity, skipOpportunity } from '../api/opportunities';
import { ApiError } from '../api/client';
import OpportunityCard from '../components/OpportunityCard';
import OpportunityDetailDrawer from '../components/OpportunityDetailDrawer';
import { EmptyState, ErrorState, LoadingState } from '../components/ui/AsyncStates';
import PageHeader from '../components/ui/PageHeader';
import type { DigestResponse, OpportunitySummary } from '../types';
import { downloadCsv, rowsToCsv } from '../utils/csv';

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

const CSV_HEADERS = [
  'digest_date',
  'title',
  'company',
  'location',
  'overall_score',
  'visa_status',
  'classification',
  'archetype',
  'salary',
  'remote_type',
  'feedback',
  'url',
] as const;

function opportunityToCsvRow(opp: OpportunitySummary, fallbackDate: string): unknown[] {
  const location = [opp.city, opp.country].filter(Boolean).join(', ');
  const salary =
    opp.salary?.usd_min != null && opp.salary?.usd_max != null
      ? `$${Math.round(opp.salary.usd_min / 1000)}–${Math.round(opp.salary.usd_max / 1000)}k/yr USD`
      : opp.salary_display ?? '';
  return [
    opp.digest_date ?? fallbackDate,
    opp.title,
    opp.company,
    location,
    opp.overall_score ?? '',
    opp.visa_status ?? '',
    opp.classification ?? '',
    opp.archetype ?? '',
    salary,
    opp.remote_type ?? '',
    opp.user_feedback ?? '',
    opp.url ?? '',
  ];
}

function exportDigestOpportunitiesCsv(
  items: OpportunitySummary[],
  digestDate: string | null | undefined,
): void {
  const date = digestDate ?? todayIso();
  const csv = rowsToCsv(
    [...CSV_HEADERS],
    items.map((opp) => opportunityToCsvRow(opp, date)),
  );
  downloadCsv(`digest-${date}.csv`, csv);
}

export default function DailyDigest() {
  const { token } = useAuth();
  const { profile } = useProfile();
  const scoreThreshold = profile?.score_warning_threshold ?? 40;
  const [refreshKey, setRefreshKey] = useState(0);
  const { selectedId, setSelectedId, detail } = useOpportunityDetail(token);

  const digest = useAsync<DigestResponse | null>(
    async (signal) => {
      if (!token) return null;
      try {
        return await getTodayDigest(token, signal);
      } catch (err) {
        if (err instanceof ApiError && err.code === 'NOT_FOUND') return null;
        throw err;
      }
    },
    [token],
    Boolean(token),
  );

  const opportunities = useAsync(
    (signal) => {
      if (!token) return Promise.reject(new Error('Not authenticated'));
      const today = todayIso();
      return listOpportunities(
        token,
        { min_score: 50, date_from: today, date_to: today, page_size: 50 },
        signal,
      ).then((r) => r.items);
    },
    [token, refreshKey],
    Boolean(token),
  );

  const refetchAll = useCallback(() => {
    digest.refetch();
    setRefreshKey((k) => k + 1);
    if (selectedId) detail.refetch();
  }, [digest, selectedId, detail]);

  const { busyId, actionError, runAction } = useOpportunityActions(refetchAll);

  const canExport = Boolean(opportunities.data?.length);
  const handleExportCsv = useCallback(() => {
    if (!opportunities.data?.length) return;
    exportDigestOpportunitiesCsv(
      opportunities.data,
      digest.data?.digest_date ?? todayIso(),
    );
  }, [opportunities.data, digest.data?.digest_date]);

  if (digest.loading && opportunities.loading) return <LoadingState message="Loading digest…" />;

  return (
    <div className="space-y-10">
      <PageHeader
        title="Digest."
        subtitle="Your daily brief and the roles worth a closer look."
        action={
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={!canExport}
            title={
              canExport
                ? 'Download today’s opportunities as CSV'
                : 'No opportunities to export yet'
            }
            className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2.5 text-[14px] font-medium text-ink hover:bg-soft disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <Download className="h-4 w-4 text-muted" strokeWidth={1.75} />
            Export CSV
          </button>
        }
      />

      {actionError && (
        <div className="text-[14px] text-[#b00020] bg-[#fff2f2] border border-[#f5c2c2] px-4 py-3 rounded-[12px]">
          {actionError}
        </div>
      )}

      <section className="space-y-3">
        <h3 className="section-label">Today&apos;s brief</h3>
        {digest.loading ? (
          <LoadingState message="Loading digest…" />
        ) : !digest.data ? (
          <div className="sophisticated-card p-8 text-[15px] text-muted leading-relaxed">
            No digest for today yet. Run the pipeline from Pipeline after uploading your resume in
            Settings.
          </div>
        ) : (
          <pre className="sophisticated-card p-8 text-[15px] whitespace-pre-wrap text-ink leading-relaxed overflow-x-auto tracking-[-0.01em]">
            {digest.data.content_text}
          </pre>
        )}
        {digest.error && <ErrorState message={digest.error} onRetry={digest.refetch} />}
      </section>

      <section className="space-y-4">
        <h3 className="section-label">Opportunities · score ≥ 50</h3>
        {opportunities.loading ? (
          <LoadingState message="Loading opportunities…" />
        ) : opportunities.error ? (
          <ErrorState message={opportunities.error} onRetry={opportunities.refetch} />
        ) : !opportunities.data?.length ? (
          <EmptyState message="No scored opportunities yet. Run the pipeline after onboarding." />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {opportunities.data.map((opp) => (
              <OpportunityCard
                key={opp.id}
                opportunity={opp}
                busy={busyId === opp.id}
                scoreWarningThreshold={scoreThreshold}
                onViewDetails={(id) => setSelectedId(id)}
                onApprove={(id) => runAction(id, () => approveOpportunity(token!, id))}
                onSkip={(id) => runAction(id, () => skipOpportunity(token!, id))}
                onReject={(id, reason) =>
                  runAction(id, () => rejectOpportunity(token!, id, { reason }))
                }
              />
            ))}
          </div>
        )}
      </section>

      <OpportunityDetailDrawer
        open={Boolean(selectedId)}
        onClose={() => setSelectedId(null)}
        loading={detail.loading}
        error={detail.error}
        detail={detail.data}
        busy={busyId === selectedId}
        scoreWarningThreshold={scoreThreshold}
        onRetry={detail.refetch}
        onApprove={(id) => runAction(id, () => approveOpportunity(token!, id))}
        onSkip={(id) => runAction(id, () => skipOpportunity(token!, id))}
        onReject={(id, reason) =>
          runAction(id, () => rejectOpportunity(token!, id, { reason }))
        }
      />
    </div>
  );
}
