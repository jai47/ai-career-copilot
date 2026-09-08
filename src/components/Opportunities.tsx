import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';
import { useAsync } from '../hooks/useAsync';
import { useOpportunityActions } from '../hooks/useOpportunityActions';
import { useOpportunityDetail } from '../hooks/useOpportunityDetail';
import {
  approveOpportunity,
  listOpportunities,
  rejectOpportunity,
  skipOpportunity,
  type OpportunityListParams,
} from '../api/opportunities';
import OpportunityDetailPanel from '../components/OpportunityDetailPanel';
import { GradeChip } from '../components/GradeDisplay';
import { CLASSIFICATION_OPTIONS, COUNTRY_OPTIONS, ARCHETYPE_OPTIONS, VISA_STATUS_OPTIONS } from '../constants';
import FilterChipGroup from '../components/ui/FilterChipGroup';
import { EmptyState, ErrorState, LoadingState } from '../components/ui/AsyncStates';
import PageHeader from '../components/ui/PageHeader';

interface MultiFilters {
  countries: string[];
  visa_statuses: string[];
  archetypes: string[];
  classifications: string[];
}

const EMPTY_MULTI: MultiFilters = {
  countries: [],
  visa_statuses: [],
  archetypes: [],
  classifications: [],
};

export default function Opportunities() {
  const { token } = useAuth();
  const { profile } = useProfile();
  const scoreThreshold = profile?.score_warning_threshold ?? 40;
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Omit<OpportunityListParams, 'page'>>({
    page_size: 25,
    min_score: 0,
  });
  const [multiFilters, setMultiFilters] = useState<MultiFilters>(EMPTY_MULTI);
  const { selectedId, setSelectedId, detail } = useOpportunityDetail(token);

  const queryParams = useMemo(
    (): OpportunityListParams => ({
      ...filters,
      page,
      countries: multiFilters.countries.length ? multiFilters.countries.join(',') : undefined,
      visa_statuses: multiFilters.visa_statuses.length ? multiFilters.visa_statuses.join(',') : undefined,
      archetypes: multiFilters.archetypes.length ? multiFilters.archetypes.join(',') : undefined,
      classifications: multiFilters.classifications.length
        ? multiFilters.classifications.join(',')
        : undefined,
    }),
    [filters, page, multiFilters],
  );

  const list = useAsync(
    (signal) => {
      if (!token) return Promise.reject(new Error('Not authenticated'));
      return listOpportunities(token, queryParams, signal);
    },
    [token, JSON.stringify(queryParams)],
    Boolean(token),
  );

  const onActionSuccess = () => {
    list.refetch();
    if (selectedId) detail.refetch();
  };

  const { busyId, actionError, runAction } = useOpportunityActions(onActionSuccess);

  const applyFilters = () => {
    setPage(1);
    list.refetch();
  };

  const totalPages = list.data ? Math.max(1, Math.ceil(list.data.total / list.data.page_size)) : 1;

  const countryOptions = Object.entries(COUNTRY_OPTIONS).map(([value, label]) => ({ value, label }));
  const visaOptions = VISA_STATUS_OPTIONS.map((value) => ({ value, label: value }));
  const archetypeOptions = ARCHETYPE_OPTIONS.map((o) => ({ value: o.value, label: o.label }));
  const classificationOptions = CLASSIFICATION_OPTIONS.map((value) => ({
    value,
    label: value.replace(/_/g, ' '),
  }));

  return (
    <div className="space-y-8">
      <PageHeader
        title="Jobs."
        subtitle="Browse, filter, and decide — you apply on your own terms."
      />

      {actionError && (
        <div className="text-[14px] text-[#b00020] bg-[#fff2f2] border border-[#f5c2c2] px-4 py-3 rounded-[12px]">
          {actionError}
        </div>
      )}

      <aside
        data-coach-id="jobs-filters"
        className="sophisticated-card p-6 grid gap-5 sm:grid-cols-2 text-[14px]"
      >
        <FilterChipGroup
          label="Countries"
          options={countryOptions}
          selected={multiFilters.countries}
          onChange={(countries) => setMultiFilters((f) => ({ ...f, countries }))}
        />
        <FilterChipGroup
          label="Visa status"
          options={visaOptions}
          selected={multiFilters.visa_statuses}
          onChange={(visa_statuses) => setMultiFilters((f) => ({ ...f, visa_statuses }))}
        />
        <FilterChipGroup
          label="Archetype"
          options={archetypeOptions}
          selected={multiFilters.archetypes}
          onChange={(archetypes) => setMultiFilters((f) => ({ ...f, archetypes }))}
        />
        <FilterChipGroup
          label="Classification"
          options={classificationOptions}
          selected={multiFilters.classifications}
          onChange={(classifications) => setMultiFilters((f) => ({ ...f, classifications }))}
        />
        <div>
          <label className="text-[14px] font-medium text-slate-400 block mb-1">
            Min score: {filters.min_score ?? 0}
          </label>
          <input
            type="range"
            min={0}
            max={100}
            value={Number(filters.min_score ?? 0)}
            onChange={(e) => setFilters((f) => ({ ...f, min_score: Number(e.target.value) }))}
            className="w-full accent-accent"
          />
        </div>
        <div>
          <label className="text-[14px] font-medium text-slate-400 block mb-1">
            Min USD salary (k)
          </label>
          <input
            type="number"
            min={0}
            placeholder="e.g. 80"
            value={filters.min_salary_usd ? String(Math.round(Number(filters.min_salary_usd) / 1000)) : ''}
            onChange={(e) =>
              setFilters((f) => ({
                ...f,
                min_salary_usd: e.target.value ? Number(e.target.value) * 1000 : undefined,
              }))
            }
            className="w-full bg-canvas border border-line rounded-xl px-2 py-1.5"
          />
        </div>
        <label className="flex items-center gap-2 text-xs cursor-pointer sm:col-span-2">
          <input
            type="checkbox"
            checked={Boolean(filters.exclude_suspicious)}
            onChange={(e) =>
              setFilters((f) => ({ ...f, exclude_suspicious: e.target.checked || undefined }))
            }
            className="accent-accent"
          />
          Hide suspicious listings
        </label>
        <div>
          <label className="text-[14px] font-medium text-slate-400 block mb-1">From</label>
          <input
            type="date"
            value={String(filters.date_from ?? '')}
            onChange={(e) => setFilters((f) => ({ ...f, date_from: e.target.value || undefined }))}
            className="w-full bg-canvas border border-line rounded-xl px-2 py-1.5"
          />
        </div>
        <div>
          <label className="text-[14px] font-medium text-slate-400 block mb-1">To</label>
          <input
            type="date"
            value={String(filters.date_to ?? '')}
            onChange={(e) => setFilters((f) => ({ ...f, date_to: e.target.value || undefined }))}
            className="w-full bg-canvas border border-line rounded-xl px-2 py-1.5"
          />
        </div>
        <button
          type="button"
          onClick={applyFilters}
          className="sm:col-span-2 self-end py-2 bg-accent hover:bg-accent-hover text-white text-[14px] font-medium rounded-full px-5 py-2.5 cursor-pointer"
        >
          Apply filters
        </button>
      </aside>

      <div data-coach-id="jobs-list" className="grid lg:grid-cols-2 gap-6">
        <div>
          {list.loading ? (
            <LoadingState />
          ) : list.error ? (
            <ErrorState message={list.error} onRetry={list.refetch} />
          ) : !list.data?.items.length ? (
            <EmptyState message="No opportunities match your filters." />
          ) : (
            <>
              <div className="space-y-2 mb-4">
                {list.data.items.map((opp) => (
                  <button
                    key={opp.id}
                    type="button"
                    onClick={() => setSelectedId(opp.id)}
                    className={`w-full text-left p-3 rounded-xl border transition-colors cursor-pointer ${
                      selectedId === opp.id
                        ? 'border-accent bg-soft'
                        : 'border-line hover:border-accent/40'
                    }`}
                  >
                    <div className="flex justify-between gap-2 items-start">
                      <div>
                        <p className="text-sm text-ink">{opp.title}</p>
                        <p className="text-xs text-accent">{opp.company}</p>
                        {opp.overall_score != null && opp.overall_score < scoreThreshold && (
                          <p className="text-[9px] text-amber-300/90 mt-0.5">Low match</p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-0.5">
                        <GradeChip score={opp.overall_score} />
                        <span className="text-lg font-semibold tracking-[-0.02em] text-accent">
                          {(opp.overall_score ?? 0).toFixed(0)}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              <div className="flex items-center justify-between text-xs font-mono">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="flex items-center gap-1 disabled:opacity-30 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" /> Prev
                </button>
                <span>
                  Page {page} / {totalPages} ({list.data.total} total)
                </span>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="flex items-center gap-1 disabled:opacity-30 cursor-pointer"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
        </div>

        <div>
          {!selectedId ? (
            <EmptyState message="Select an opportunity to view details." />
          ) : detail.loading ? (
            <LoadingState message="Loading details…" />
          ) : detail.error ? (
            <ErrorState message={detail.error} onRetry={detail.refetch} />
          ) : detail.data ? (
            <OpportunityDetailPanel
              detail={detail.data}
              busy={busyId === detail.data.id}
              scoreWarningThreshold={scoreThreshold}
              onApprove={(id) => runAction(id, () => approveOpportunity(token!, id))}
              onSkip={(id) => runAction(id, () => skipOpportunity(token!, id))}
              onReject={(id, reason) =>
                runAction(id, () => rejectOpportunity(token!, id, { reason }))
              }
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
