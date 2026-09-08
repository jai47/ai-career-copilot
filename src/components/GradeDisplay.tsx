import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { gradeFromScore } from '../utils/grading';

interface GradeChipProps {
  score: number | null | undefined;
  className?: string;
}

export function GradeChip({ score, className = '' }: GradeChipProps) {
  const info = gradeFromScore(score);
  if (!info) return null;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 text-[12px] font-semibold border rounded-full ${info.chipClass} ${className}`}
      title={info.label}
    >
      {info.grade}
    </span>
  );
}

interface LowMatchWarningProps {
  score: number | null | undefined;
  threshold: number;
}

export function LowMatchWarning({ score, threshold }: LowMatchWarningProps) {
  if (score == null || score >= threshold) return null;

  return (
    <div className="mt-2 px-3 py-2 text-[13px] font-medium bg-[#fff9eb] border border-[#f0d78c] text-[#8a6d00] rounded-[12px]">
      Low match — consider skipping (below your {threshold} threshold)
    </div>
  );
}

interface ScoreBreakdownProps {
  dimensions: {
    score_skill_match?: number | null;
    score_role_match?: number | null;
    score_experience?: number | null;
    score_country_pref?: number | null;
    score_remote_pref?: number | null;
    score_fit?: number | null;
    score_visa?: number | null;
  };
  defaultOpen?: boolean;
}

const ROWS: { key: keyof ScoreBreakdownProps['dimensions']; label: string }[] = [
  { key: 'score_skill_match', label: 'Skill match' },
  { key: 'score_role_match', label: 'Role match' },
  { key: 'score_experience', label: 'Experience' },
  { key: 'score_country_pref', label: 'Country preference' },
  { key: 'score_remote_pref', label: 'Remote preference' },
  { key: 'score_fit', label: 'Fit (composite)' },
];

export function ScoreBreakdown({ dimensions, defaultOpen = false }: ScoreBreakdownProps) {
  const [open, setOpen] = useState(defaultOpen);
  const hasAny = ROWS.some((r) => dimensions[r.key] != null);
  if (!hasAny) return null;

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1 text-[14px] font-medium text-accent/80 hover:text-accent cursor-pointer"
      >
        {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        Score breakdown
      </button>
      {open && (
        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-[13px]">
          {ROWS.map(({ key, label }) => {
            const val = dimensions[key];
            if (val == null) return null;
            return (
              <div key={key} className="flex justify-between gap-2 col-span-2 sm:col-span-1">
                <dt className="text-muted">{label}</dt>
                <dd className="text-ink font-medium">{Number(val).toFixed(0)}</dd>
              </div>
            );
          })}
          {dimensions.score_visa != null && (
            <div className="flex justify-between gap-2 col-span-2 border-t border-line pt-2 mt-1">
              <dt className="text-muted">Visa score</dt>
              <dd className="text-ink font-medium">{dimensions.score_visa}</dd>
            </div>
          )}
        </dl>
      )}
    </div>
  );
}
