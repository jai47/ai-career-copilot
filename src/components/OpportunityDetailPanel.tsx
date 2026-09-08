import OpportunityCard from './OpportunityCard';
import type { OpportunityDetail, RejectReason } from '../types';

interface OpportunityDetailPanelProps {
  detail: OpportunityDetail;
  busy?: boolean;
  scoreWarningThreshold: number;
  onApprove: (id: string) => void;
  onSkip: (id: string) => void;
  onReject: (id: string, reason: RejectReason) => void;
  className?: string;
}

export default function OpportunityDetailPanel({
  detail: d,
  busy,
  scoreWarningThreshold,
  onApprove,
  onSkip,
  onReject,
  className = 'sophisticated-card p-5 rounded-xl space-y-4 sticky top-4',
}: OpportunityDetailPanelProps) {
  return (
    <div className={className}>
      <OpportunityCard
        opportunity={d}
        busy={busy}
        scoreWarningThreshold={scoreWarningThreshold}
        onApprove={async (id) => onApprove(id)}
        onSkip={async (id) => onSkip(id)}
        onReject={async (id, reason) => onReject(id, reason)}
      />
      <div className="text-xs space-y-3 border-t border-line pt-4">
        <ScoreRow label="Skill match" value={d.score_skill_match} />
        <ScoreRow label="Role match" value={d.score_role_match} />
        <ScoreRow label="Experience" value={d.score_experience} />
        <ScoreRow label="Country pref" value={d.score_country_pref} />
        <ScoreRow label="Remote pref" value={d.score_remote_pref} />
        <ScoreRow label="Fit composite" value={d.score_fit} />
        {d.fit_reasoning && (
          <div>
            <p className="text-[14px] font-medium text-accent mb-1">Fit reasoning</p>
            <p className="text-slate-600 whitespace-pre-wrap">{d.fit_reasoning}</p>
          </div>
        )}
        {d.visa_reasoning && (
          <div>
            <p className="text-[14px] font-medium text-accent mb-1">Visa reasoning</p>
            <p className="text-slate-600 whitespace-pre-wrap">{d.visa_reasoning}</p>
          </div>
        )}
        {d.skills_required?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {d.skills_required.map((s) => (
              <span
                key={s}
                className="text-[10px] px-2 py-0.5 bg-soft border border-line rounded-xl"
              >
                {s}
              </span>
            ))}
          </div>
        )}
        {d.description && (
          <div>
            <p className="text-[14px] font-medium text-accent mb-1">Description</p>
            <p className="text-slate-500 whitespace-pre-wrap max-h-64 overflow-y-auto text-[11px] leading-relaxed">
              {d.description}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function ScoreRow({ label, value }: { label: string; value: number | null | undefined }) {
  if (value == null) return null;
  return (
    <div className="flex justify-between font-mono text-[13px] font-medium">
      <span className="text-slate-400">{label}</span>
      <span className="text-accent">{value.toFixed(1)}</span>
    </div>
  );
}
