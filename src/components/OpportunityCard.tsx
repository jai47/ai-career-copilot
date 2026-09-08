import { useState } from 'react';
import { CheckCircle2, ExternalLink, SkipForward, XCircle } from 'lucide-react';
import type { OpportunitySummary, RejectReason } from '../types';
import { REJECT_REASONS } from '../constants';
import { GradeChip, LowMatchWarning, ScoreBreakdown } from './GradeDisplay';

interface OpportunityCardProps {
  opportunity: OpportunitySummary;
  onApprove: (id: string) => Promise<void>;
  onSkip: (id: string) => Promise<void>;
  onReject: (id: string, reason: RejectReason) => Promise<void>;
  onViewDetails?: (id: string) => void;
  busy?: boolean;
  scoreWarningThreshold?: number;
}

export default function OpportunityCard({
  opportunity: opp,
  onApprove,
  onSkip,
  onReject,
  onViewDetails,
  busy,
  scoreWarningThreshold = 40,
}: OpportunityCardProps) {
  const [rejectReason, setRejectReason] = useState<RejectReason>('other');
  const [showReject, setShowReject] = useState(false);
  const hasFeedback = Boolean(opp.user_feedback);
  const score = opp.overall_score;

  const location = [opp.city, opp.country].filter(Boolean).join(', ') || '—';

  return (
    <article className="sophisticated-card p-6 transition-colors">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex-1 min-w-[200px]">
          <h3 className="text-[17px] font-semibold tracking-[-0.02em] text-ink leading-snug">
            {opp.title}
          </h3>
          <p className="text-[15px] text-accent mt-1.5 font-medium">{opp.company}</p>
          <p className="text-[13px] text-muted mt-1">{location}</p>
        </div>
        <div className="text-right flex flex-col items-end gap-1">
          <div className="flex items-center gap-2">
            <GradeChip score={score} />
            {score != null && (
              <div className="text-[28px] font-semibold tracking-[-0.03em] text-ink">
                {score.toFixed(0)}
              </div>
            )}
          </div>
          <div className="text-[12px] text-muted">Match</div>
        </div>
      </div>

      <LowMatchWarning score={score} threshold={scoreWarningThreshold} />
      <ScoreBreakdown dimensions={opp} />

      <div className="flex flex-wrap gap-2 mt-4">
        {opp.visa_status && <Tag>Visa: {opp.visa_status}</Tag>}
        {opp.classification && <Tag>{opp.classification.replace(/_/g, ' ')}</Tag>}
        {opp.archetype && <Tag>{opp.archetype.replace(/_/g, ' ')}</Tag>}
        {opp.salary?.usd_min != null && opp.salary?.usd_max != null && (
          <Tag>
            ≈ ${Math.round(opp.salary.usd_min / 1000)}–{Math.round(opp.salary.usd_max / 1000)}k/yr
          </Tag>
        )}
        {!opp.salary?.usd_min && opp.salary_display && <Tag>{opp.salary_display}</Tag>}
        {opp.repost?.is_repost && (
          <Tag tone="info">
            Reposted{opp.repost.first_seen ? ` — first seen ${opp.repost.first_seen}` : ''}
          </Tag>
        )}
        {opp.legitimacy_flags && opp.legitimacy_flags.length > 0 && (
          <Tag
            tone="warn"
            title={opp.legitimacy_flags.map((f) => f.detail).join('; ')}
          >
            Suspicious listing
          </Tag>
        )}
        {opp.is_stale && <Tag tone="warn">Stale listing</Tag>}
        {hasFeedback && <Tag tone="ok">{opp.user_feedback}</Tag>}
      </div>

      <div className="flex flex-wrap items-center gap-2 mt-5">
        {onViewDetails && (
          <button
            type="button"
            onClick={() => onViewDetails(opp.id)}
            className="px-4 py-2 text-[14px] font-medium border border-line rounded-full hover:bg-soft cursor-pointer transition-colors"
          >
            Details
          </button>
        )}
        {opp.url && (
          <a
            href={opp.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-[14px] font-medium text-accent hover:underline underline-offset-2"
          >
            <ExternalLink className="w-3.5 h-3.5" strokeWidth={1.75} /> Posting
          </a>
        )}

        {!hasFeedback && (
          <>
            <button
              type="button"
              disabled={busy}
              onClick={() => onApprove(opp.id)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-[14px] font-medium bg-accent hover:bg-accent-hover text-white rounded-full disabled:opacity-50 cursor-pointer transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" strokeWidth={1.75} /> Approve
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => onSkip(opp.id)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-[14px] font-medium border border-line rounded-full hover:bg-soft disabled:opacity-50 cursor-pointer transition-colors"
            >
              <SkipForward className="w-4 h-4" strokeWidth={1.75} /> Skip
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => setShowReject((v) => !v)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-[14px] font-medium text-[#b00020] hover:bg-[#fff2f2] rounded-full disabled:opacity-50 cursor-pointer transition-colors"
            >
              <XCircle className="w-4 h-4" strokeWidth={1.75} /> Reject
            </button>
          </>
        )}
      </div>

      {showReject && !hasFeedback && (
        <div className="mt-4 flex flex-wrap items-center gap-2 pt-4 border-t border-line">
          <select
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value as RejectReason)}
            className="bg-surface border border-line text-[14px] px-3 py-2 rounded-[12px] text-ink"
          >
            {REJECT_REASONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={busy}
            onClick={() => onReject(opp.id, rejectReason)}
            className="px-4 py-2 text-[14px] font-medium bg-[#fff2f2] border border-[#f5c2c2] text-[#b00020] rounded-full cursor-pointer disabled:opacity-50"
          >
            Confirm reject
          </button>
        </div>
      )}
    </article>
  );
}

function Tag({
  children,
  tone = 'neutral',
  title,
}: {
  children: React.ReactNode;
  tone?: 'neutral' | 'info' | 'warn' | 'ok';
  title?: string;
}) {
  const tones = {
    neutral: 'bg-soft border-line text-muted',
    info: 'bg-accent-soft border-accent/20 text-accent',
    warn: 'bg-[#fff9eb] border-[#f0d78c] text-[#8a6d00]',
    ok: 'bg-emerald-50 border-emerald-200 text-emerald-700',
  };
  return (
    <span
      title={title}
      className={`px-2.5 py-1 text-[12px] font-medium border rounded-full capitalize ${tones[tone]}`}
    >
      {children}
    </span>
  );
}
