/** Parse digest content_text into structured brief data for the Digest UI. */

export interface DigestPipelineMetrics {
  discovered: number;
  afterDedup: number;
  scored: number;
  opportunities: number;
  minScore: number;
}

export interface DigestTrendingCompany {
  company: string;
  newRoles: number;
}

export interface DigestCountryCount {
  country: string;
  count: number;
}

export interface DigestTopRecommendation {
  title: string;
  company: string;
  location: string;
  remote: string;
  score: number;
  classification: string;
  visaStatus: string;
  visaScore: number;
  salary: string;
  fitReasoning: string;
  visaReasoning: string;
}

export interface ParsedDigestBrief {
  date: string | null;
  pipeline: DigestPipelineMetrics;
  trending: DigestTrendingCompany[];
  countries: DigestCountryCount[];
  top: DigestTopRecommendation | null;
}

function num(value: unknown, fallback = 0): number {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function section(text: string, heading: string): string {
  const pattern = new RegExp(
    `${heading}\\s*\\n([\\s\\S]*?)(?=\\n[A-Z][A-Z0-9 /≥()]+\\n|$)`,
    'i',
  );
  const match = text.match(pattern);
  return match?.[1]?.trim() ?? '';
}

function parsePipeline(text: string): DigestPipelineMetrics {
  const block = section(text, 'PIPELINE SUMMARY') || text;
  const read = (label: string) => {
    const match = block.match(new RegExp(`${label}:\\s*(\\d+)`, 'i'));
    return match ? Number(match[1]) : 0;
  };
  const oppMatch = block.match(/Opportunities\s*\(≥?\s*(\d+)\s*\):\s*(\d+)/i);
  return {
    discovered: read('Jobs scanned'),
    afterDedup: read('After deduplication'),
    scored: read('Scored'),
    opportunities: oppMatch ? Number(oppMatch[2]) : 0,
    minScore: oppMatch ? Number(oppMatch[1]) : 50,
  };
}

function parseTrending(text: string): DigestTrendingCompany[] {
  const block = section(text, 'TRENDING COMPANIES THIS WEEK');
  if (!block || /no new postings/i.test(block)) return [];
  return block
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const match = line.match(/^(.+?):\s*(\d+)\s+new roles?/i);
      if (!match) return null;
      return { company: match[1].trim(), newRoles: Number(match[2]) };
    })
    .filter((row): row is DigestTrendingCompany => row != null);
}

function parseCountries(text: string): DigestCountryCount[] {
  const block = section(text, 'BY COUNTRY');
  if (!block || /^\(none\)$/i.test(block.trim())) return [];
  return block
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const match = line.match(/^([A-Za-z_]+):\s*(\d+)$/);
      if (!match) return null;
      return { country: match[1].toUpperCase(), count: Number(match[2]) };
    })
    .filter((row): row is DigestCountryCount => row != null)
    .sort((a, b) => b.count - a.count || a.country.localeCompare(b.country));
}

function parseTop(text: string): DigestTopRecommendation | null {
  const block = section(text, 'TOP RECOMMENDATION');
  if (!block || /^N\/A/i.test(block.trim())) return null;

  const lines = block
    .split('\n')
    .map((line) => line.replace(/^•\s*/, '').trim())
    .filter(Boolean);
  if (!lines.length) return null;

  const headline = lines[0].match(/^(.+?)\s+[—–-]\s+(.+)$/);
  const meta = lines[1]?.match(/^(.+?)\s*\|\s*(.+)$/);
  const scoreLine = block.match(/Score:\s*([\d.]+)\/100\s*\(([^)]+)\)/i);
  const visaLine = block.match(/Visa:\s*([^\s(]+)\s*\(([\d.]+)\/100\)/i);
  const salaryLine = block.match(/Salary:\s*(.+)/i);

  const whyIdx = lines.findIndex((line) => /^Why:/i.test(line));
  const reasons =
    whyIdx >= 0
      ? lines.slice(whyIdx + 1).filter((line) => line && !/^Why:/i.test(line))
      : [];

  return {
    title: headline?.[1]?.trim() || lines[0],
    company: headline?.[2]?.trim() || '',
    location: meta?.[1]?.trim() || '',
    remote: meta?.[2]?.trim() || '',
    score: scoreLine ? Number(scoreLine[1]) : 0,
    classification: scoreLine?.[2]?.trim() || '',
    visaStatus: visaLine?.[1]?.trim() || '',
    visaScore: visaLine ? Number(visaLine[2]) : 0,
    salary: salaryLine?.[1]?.trim() || 'Not listed',
    fitReasoning: reasons[0] || '',
    visaReasoning: reasons[1] || '',
  };
}

function fromMetricsJson(metrics: Record<string, unknown> | null | undefined): Partial<ParsedDigestBrief> {
  if (!metrics || typeof metrics !== 'object') return {};
  const brief = (metrics.brief as Record<string, unknown> | undefined) ?? metrics;

  const trendingRaw = brief.trending ?? brief.trending_companies;
  const countriesRaw = brief.countries ?? brief.country_breakdown;
  const topRaw = brief.top ?? brief.top_recommendation;

  const trending = Array.isArray(trendingRaw)
    ? trendingRaw
        .map((row) => {
          if (!row || typeof row !== 'object') return null;
          const item = row as Record<string, unknown>;
          const company = String(item.company ?? '');
          const newRoles = num(item.new_roles ?? item.newRoles ?? item.count);
          if (!company) return null;
          return { company, newRoles };
        })
        .filter((row): row is DigestTrendingCompany => row != null)
    : undefined;

  const countries = Array.isArray(countriesRaw)
    ? countriesRaw
        .map((row) => {
          if (!row || typeof row !== 'object') return null;
          const item = row as Record<string, unknown>;
          const country = String(item.country ?? '').toUpperCase();
          const count = num(item.count);
          if (!country) return null;
          return { country, count };
        })
        .filter((row): row is DigestCountryCount => row != null)
    : undefined;

  let top: DigestTopRecommendation | null | undefined;
  if (topRaw && typeof topRaw === 'object') {
    const item = topRaw as Record<string, unknown>;
    top = {
      title: String(item.title ?? 'N/A'),
      company: String(item.company ?? ''),
      location: String(item.location ?? item.country ?? ''),
      remote: String(item.remote ?? item.remote_type ?? ''),
      score: num(item.score ?? item.overall_score),
      classification: String(item.classification ?? ''),
      visaStatus: String(item.visa_status ?? item.visaStatus ?? ''),
      visaScore: num(item.visa_score ?? item.visaScore ?? item.score_visa),
      salary: String(item.salary ?? item.salary_display ?? 'Not listed'),
      fitReasoning: String(item.fit_reasoning ?? item.fitReasoning ?? ''),
      visaReasoning: String(item.visa_reasoning ?? item.visaReasoning ?? ''),
    };
    if (top.title === 'N/A' && !top.company) top = null;
  }

  return {
    pipeline: {
      discovered: num(brief.discovered ?? metrics.discovered),
      afterDedup: num(brief.after_dedup ?? brief.afterDedup ?? metrics.after_dedup),
      scored: num(brief.scored ?? metrics.scored),
      opportunities: num(brief.top_count ?? brief.opportunities ?? metrics.top_count),
      minScore: num(brief.min_score ?? brief.minScore, 50),
    },
    trending,
    countries,
    top,
  };
}

export function parseDigestBrief(
  contentText: string,
  metricsJson?: Record<string, unknown> | null,
  digestDate?: string | null,
): ParsedDigestBrief {
  const fromText: ParsedDigestBrief = {
    date: digestDate ?? contentText.match(/AI CAREER DIGEST\s*[—–-]\s*(\d{4}-\d{2}-\d{2})/i)?.[1] ?? null,
    pipeline: parsePipeline(contentText),
    trending: parseTrending(contentText),
    countries: parseCountries(contentText),
    top: parseTop(contentText),
  };

  const fromMetrics = fromMetricsJson(metricsJson);
  return {
    date: fromText.date,
    pipeline: {
      discovered: fromMetrics.pipeline?.discovered || fromText.pipeline.discovered,
      afterDedup: fromMetrics.pipeline?.afterDedup || fromText.pipeline.afterDedup,
      scored: fromMetrics.pipeline?.scored || fromText.pipeline.scored,
      opportunities: fromMetrics.pipeline?.opportunities || fromText.pipeline.opportunities,
      minScore: fromMetrics.pipeline?.minScore || fromText.pipeline.minScore,
    },
    trending: fromMetrics.trending?.length ? fromMetrics.trending : fromText.trending,
    countries: fromMetrics.countries?.length ? fromMetrics.countries : fromText.countries,
    top: fromMetrics.top !== undefined ? fromMetrics.top : fromText.top,
  };
}
