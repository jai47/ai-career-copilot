import { Building2, Globe2, Sparkles, Target } from 'lucide-react';
import type { DigestResponse } from '../types';
import { parseDigestBrief, type ParsedDigestBrief } from '../utils/parseDigestBrief';

const COUNTRY_COLORS = [
  '#0071e3',
  '#34c759',
  '#ff9500',
  '#af52de',
  '#ff2d55',
  '#5ac8fa',
  '#5856d6',
  '#ffcc00',
];

function formatDateLabel(iso: string | null): string {
  if (!iso) return 'Today';
  const date = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function classificationLabel(value: string): string {
  return value.replace(/_/g, ' ');
}

function MetricCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: number;
  hint?: string;
}) {
  return (
    <div className="rounded-[16px] border border-line bg-surface p-5">
      <p className="text-[12px] font-medium uppercase tracking-[0.06em] text-muted">{label}</p>
      <p className="mt-2 text-[32px] font-semibold tracking-[-0.04em] text-ink tabular-nums">
        {value.toLocaleString()}
      </p>
      {hint ? <p className="mt-1 text-[13px] text-muted">{hint}</p> : null}
    </div>
  );
}

function FunnelBars({ brief }: { brief: ParsedDigestBrief }) {
  const steps = [
    { label: 'Scanned', value: brief.pipeline.discovered },
    { label: 'After dedup', value: brief.pipeline.afterDedup },
    { label: 'Scored', value: brief.pipeline.scored },
    { label: `≥ ${brief.pipeline.minScore}`, value: brief.pipeline.opportunities },
  ];
  const max = Math.max(...steps.map((step) => step.value), 1);

  return (
    <div className="rounded-[16px] border border-line bg-surface p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Target className="h-4 w-4 text-accent" strokeWidth={1.75} />
        <h4 className="text-[15px] font-semibold tracking-[-0.02em] text-ink">Pipeline funnel</h4>
      </div>
      <div className="space-y-3">
        {steps.map((step, index) => (
          <div key={step.label} className="space-y-1.5">
            <div className="flex items-baseline justify-between gap-3 text-[13px]">
              <span className="text-muted">
                {index + 1}. {step.label}
              </span>
              <span className="font-medium tabular-nums text-ink">{step.value.toLocaleString()}</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-soft">
              <div
                className="h-full rounded-full bg-accent transition-[width] duration-500 ease-out"
                style={{ width: `${Math.max((step.value / max) * 100, step.value > 0 ? 4 : 0)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TrendingChart({ items }: { items: ParsedDigestBrief['trending'] }) {
  if (!items.length) {
    return (
      <div className="rounded-[16px] border border-line bg-surface p-5 text-[14px] text-muted">
        No new company postings this week yet.
      </div>
    );
  }
  const max = Math.max(...items.map((item) => item.newRoles), 1);

  return (
    <div className="rounded-[16px] border border-line bg-surface p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Building2 className="h-4 w-4 text-accent" strokeWidth={1.75} />
        <h4 className="text-[15px] font-semibold tracking-[-0.02em] text-ink">
          Trending companies
        </h4>
      </div>
      <p className="text-[13px] text-muted -mt-2">New roles discovered in the last 7 days</p>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.company} className="space-y-1.5">
            <div className="flex items-baseline justify-between gap-3 text-[14px]">
              <span className="font-medium text-ink truncate">{item.company}</span>
              <span className="shrink-0 tabular-nums text-muted">{item.newRoles}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-soft">
              <div
                className="h-full rounded-full bg-[#34c759]/80 transition-[width] duration-500 ease-out"
                style={{ width: `${Math.max((item.newRoles / max) * 100, 6)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CountryChart({ items }: { items: ParsedDigestBrief['countries'] }) {
  if (!items.length) {
    return (
      <div className="rounded-[16px] border border-line bg-surface p-5 text-[14px] text-muted">
        No country breakdown for today’s opportunities.
      </div>
    );
  }

  const total = items.reduce((sum, item) => sum + item.count, 0) || 1;
  let offset = 0;
  const segments = items.map((item, index) => {
    const pct = (item.count / total) * 100;
    const start = offset;
    offset += pct;
    return {
      ...item,
      pct,
      start,
      color: COUNTRY_COLORS[index % COUNTRY_COLORS.length],
    };
  });

  const gradient = segments
    .map((segment) => `${segment.color} ${segment.start}% ${segment.start + segment.pct}%`)
    .join(', ');

  return (
    <div className="rounded-[16px] border border-line bg-surface p-5 space-y-5">
      <div className="flex items-center gap-2">
        <Globe2 className="h-4 w-4 text-accent" strokeWidth={1.75} />
        <h4 className="text-[15px] font-semibold tracking-[-0.02em] text-ink">By country</h4>
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center gap-6">
        <div
          className="mx-auto h-36 w-36 shrink-0 rounded-full"
          style={{
            background: `conic-gradient(${gradient})`,
            mask: 'radial-gradient(circle at center, transparent 52%, black 53%)',
            WebkitMask: 'radial-gradient(circle at center, transparent 52%, black 53%)',
          }}
          role="img"
          aria-label="Opportunity share by country"
        />
        <ul className="flex-1 space-y-2.5 min-w-0">
          {segments.map((segment) => (
            <li key={segment.country} className="flex items-center gap-3 text-[14px]">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ background: segment.color }}
              />
              <span className="flex-1 truncate font-medium text-ink">{segment.country}</span>
              <span className="tabular-nums text-muted">
                {segment.count} · {Math.round(segment.pct)}%
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function TopPick({ top }: { top: NonNullable<ParsedDigestBrief['top']> }) {
  return (
    <div className="rounded-[16px] border border-accent/25 bg-accent-soft/40 p-6 space-y-4">
      <div className="flex items-center gap-2 text-accent">
        <Sparkles className="h-4 w-4" strokeWidth={1.75} />
        <p className="text-[12px] font-semibold uppercase tracking-[0.08em]">Top recommendation</p>
      </div>
      <div className="space-y-1">
        <h4 className="text-[22px] font-semibold tracking-[-0.03em] text-ink leading-snug">
          {top.title}
        </h4>
        <p className="text-[15px] text-muted">
          {top.company}
          {top.location ? ` · ${top.location}` : ''}
          {top.remote ? ` · ${top.remote}` : ''}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <span className="rounded-full bg-surface border border-line px-3 py-1 text-[13px] font-medium text-ink tabular-nums">
          Score {top.score}/100
        </span>
        {top.classification ? (
          <span className="rounded-full bg-surface border border-line px-3 py-1 text-[13px] font-medium text-ink capitalize">
            {classificationLabel(top.classification)}
          </span>
        ) : null}
        {top.visaStatus ? (
          <span className="rounded-full bg-surface border border-line px-3 py-1 text-[13px] font-medium text-ink">
            Visa {top.visaStatus} ({top.visaScore}/100)
          </span>
        ) : null}
        {top.salary && top.salary !== 'Not listed' ? (
          <span className="rounded-full bg-surface border border-line px-3 py-1 text-[13px] font-medium text-ink">
            {top.salary}
          </span>
        ) : null}
      </div>
      {(top.fitReasoning || top.visaReasoning) && (
        <ul className="space-y-2 text-[14px] text-ink/80 leading-relaxed">
          {top.fitReasoning ? <li className="flex gap-2"><span className="text-accent">•</span><span>{top.fitReasoning}</span></li> : null}
          {top.visaReasoning ? <li className="flex gap-2"><span className="text-accent">•</span><span>{top.visaReasoning}</span></li> : null}
        </ul>
      )}
    </div>
  );
}

export default function DigestBrief({ digest }: { digest: DigestResponse }) {
  const brief = parseDigestBrief(digest.content_text, digest.metrics_json, digest.digest_date);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[13px] font-medium text-muted">Brief for</p>
          <p className="text-[18px] font-semibold tracking-[-0.02em] text-ink">
            {formatDateLabel(brief.date)}
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Jobs scanned" value={brief.pipeline.discovered} />
        <MetricCard label="After dedup" value={brief.pipeline.afterDedup} />
        <MetricCard label="Scored" value={brief.pipeline.scored} />
        <MetricCard
          label="Opportunities"
          value={brief.pipeline.opportunities}
          hint={`Score ≥ ${brief.pipeline.minScore}`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <FunnelBars brief={brief} />
        <TrendingChart items={brief.trending} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <CountryChart items={brief.countries} />
        {brief.top ? (
          <TopPick top={brief.top} />
        ) : (
          <div className="rounded-[16px] border border-line bg-surface p-5 text-[14px] text-muted">
            No top recommendation yet for this digest.
          </div>
        )}
      </div>
    </div>
  );
}
