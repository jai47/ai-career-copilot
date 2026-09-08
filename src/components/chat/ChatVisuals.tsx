import { CheckCircle2, Circle, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { ChatVisual, SuggestedAction } from '../../types';

const TONE: Record<string, string> = {
  neutral: 'text-ink',
  accent: 'text-accent',
  warn: 'text-[#8a6d00]',
  ok: 'text-emerald-700',
};

interface ChatVisualCardsProps {
  visuals: ChatVisual[];
  onQuickReply?: (text: string) => void;
  onAction?: (action: SuggestedAction) => void;
  compact?: boolean;
}

export function ChatVisualCards({
  visuals,
  onQuickReply,
  compact = false,
}: ChatVisualCardsProps) {
  if (!visuals?.length) return null;

  return (
    <div className={`space-y-3 ${compact ? 'mt-2' : 'mt-3'}`}>
      {visuals.map((v, i) => (
        <VisualCard key={`${v.type}-${i}`} visual={v} onQuickReply={onQuickReply} compact={compact} />
      ))}
    </div>
  );
}

function VisualCard({
  visual: v,
  onQuickReply,
  compact,
}: {
  visual: ChatVisual;
  onQuickReply?: (text: string) => void;
  compact: boolean;
}) {
  if (v.type === 'stat_row') {
    return (
      <div className="rounded-[16px] border border-line bg-surface p-3 sm:p-4">
        {v.title && <p className="text-[12px] font-medium text-muted mb-3">{v.title}</p>}
        <div className={`grid gap-2 ${compact ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-4'}`}>
          {(v.stats || []).map((s) => (
            <div key={s.label} className="rounded-[12px] bg-soft px-3 py-2.5">
              <p className="text-[11px] text-muted">{s.label}</p>
              <p className={`text-[22px] font-semibold tracking-[-0.03em] mt-0.5 ${TONE[s.tone] || TONE.neutral}`}>
                {s.value}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (v.type === 'progress' && v.progress) {
    const pct = Math.min(100, Math.round((v.progress.value / Math.max(1, v.progress.max)) * 100));
    return (
      <div className="rounded-[16px] border border-line bg-surface p-4">
        {v.title && <p className="text-[12px] font-medium text-muted mb-2">{v.title}</p>}
        <div className="flex justify-between text-[13px] mb-2">
          <span className="text-ink">{v.progress.label}</span>
          <span className="font-semibold text-accent">{pct}%</span>
        </div>
        <div className="h-2 rounded-full bg-soft overflow-hidden">
          <div
            className="h-full rounded-full bg-accent transition-[width] duration-500 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    );
  }

  if (v.type === 'job_list') {
    return (
      <div className="rounded-[16px] border border-line bg-surface p-4 space-y-2">
        {v.title && <p className="text-[12px] font-medium text-muted mb-1">{v.title}</p>}
        {(v.jobs || []).map((j) => (
          <div
            key={`${j.company}-${j.title}-${j.opportunity_id || ''}`}
            className="flex items-start justify-between gap-3 py-2 border-b border-line last:border-0"
          >
            <div className="min-w-0">
              <p className="text-[14px] font-medium text-ink truncate">{j.title}</p>
              <p className="text-[13px] text-muted">{j.company}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {j.score != null && (
                <span className="text-[15px] font-semibold text-accent">{Math.round(j.score)}</span>
              )}
              {j.url && (
                <a href={j.url} target="_blank" rel="noreferrer" className="text-accent">
                  <ExternalLink className="w-3.5 h-3.5" strokeWidth={1.75} />
                </a>
              )}
            </div>
          </div>
        ))}
        <Link to="/opportunities" className="inline-block text-[13px] font-medium text-accent mt-1">
          Browse all jobs →
        </Link>
      </div>
    );
  }

  if (v.type === 'checklist') {
    return (
      <div className="rounded-[16px] border border-line bg-surface p-4 space-y-2">
        {v.title && <p className="text-[12px] font-medium text-muted mb-1">{v.title}</p>}
        {(v.checklist || []).map((c) => (
          <div key={c.label} className="flex items-center gap-2 text-[14px]">
            {c.done ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" strokeWidth={1.75} />
            ) : (
              <Circle className="w-4 h-4 text-slate-300 shrink-0" strokeWidth={1.75} />
            )}
            {c.path ? (
              <Link to={c.path} className={c.done ? 'text-muted' : 'text-ink hover:text-accent'}>
                {c.label}
              </Link>
            ) : (
              <span className={c.done ? 'text-muted' : 'text-ink'}>{c.label}</span>
            )}
          </div>
        ))}
      </div>
    );
  }

  if (v.type === 'quick_replies') {
    return (
      <div className="flex flex-wrap gap-2">
        {(v.quick_replies || []).map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => onQuickReply?.(q)}
            className="px-3.5 py-2 text-[13px] font-medium rounded-full border border-line bg-surface text-ink hover:bg-soft transition-colors"
          >
            {q}
          </button>
        ))}
      </div>
    );
  }

  if (v.type === 'route_cta' && v.path) {
    return (
      <Link
        to={v.path}
        className="inline-flex items-center px-4 py-2.5 text-[14px] font-medium rounded-full bg-ink text-white hover:bg-ink/90 transition-colors"
      >
        {v.label || 'Open'}
      </Link>
    );
  }

  if (v.type === 'tip') {
    return (
      <div className="rounded-[16px] bg-accent-soft border border-accent/15 px-4 py-3">
        {v.title && <p className="text-[12px] font-medium text-accent mb-1">{v.title}</p>}
        <p className="text-[14px] text-ink leading-relaxed">{v.body}</p>
      </div>
    );
  }

  return null;
}

export function SuggestedActionChips({
  actions,
  onAction,
}: {
  actions: SuggestedAction[];
  onAction?: (action: SuggestedAction) => void;
}) {
  if (!actions?.length) return null;
  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {actions.map((a) => {
        const inner = (
          <button
            key={a.action + (a.application_id || '') + a.label}
            type="button"
            onClick={() => onAction?.(a)}
            className="px-3.5 py-2 text-[13px] font-medium rounded-full bg-accent-soft text-accent border border-accent/20 hover:bg-accent/10 transition-colors"
          >
            {a.label}
          </button>
        );
        if (a.path && !onAction) {
          return (
            <Link
              key={a.action + a.label}
              to={a.path}
              className="px-3.5 py-2 text-[13px] font-medium rounded-full bg-accent-soft text-accent border border-accent/20 hover:bg-accent/10 transition-colors"
            >
              {a.label}
            </Link>
          );
        }
        return inner;
      })}
    </div>
  );
}

const MOOD_RING: Record<string, string> = {
  neutral: 'from-slate-400 to-slate-600',
  encouraging: 'from-accent to-sky-600',
  urgent: 'from-amber-500 to-orange-600',
  celebratory: 'from-emerald-500 to-teal-600',
};

export function CoachAvatar({
  mood = 'neutral',
  speaking = false,
  size = 'md',
}: {
  mood?: string;
  speaking?: boolean;
  size?: 'sm' | 'md' | 'lg';
}) {
  const dim = size === 'lg' ? 'w-14 h-14' : size === 'sm' ? 'w-8 h-8' : 'w-10 h-10';
  return (
    <div className={`relative shrink-0 ${dim}`}>
      <div
        className={`absolute inset-0 rounded-full bg-gradient-to-br ${MOOD_RING[mood] || MOOD_RING.neutral} ${
          speaking ? 'animate-pulse' : ''
        }`}
      />
      <div className="absolute inset-[2px] rounded-full bg-surface flex items-center justify-center">
        <span className="text-[13px] font-semibold tracking-tight text-ink">AI</span>
      </div>
      {speaking && (
        <span className="absolute -bottom-0.5 -right-0.5 flex gap-0.5">
          <span className="w-1 h-1 rounded-full bg-accent animate-bounce [animation-delay:0ms]" />
          <span className="w-1 h-1 rounded-full bg-accent animate-bounce [animation-delay:150ms]" />
          <span className="w-1 h-1 rounded-full bg-accent animate-bounce [animation-delay:300ms]" />
        </span>
      )}
    </div>
  );
}
