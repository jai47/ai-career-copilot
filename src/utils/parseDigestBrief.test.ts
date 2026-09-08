import { describe, expect, it } from 'vitest';
import { parseDigestBrief } from './parseDigestBrief';

const SAMPLE = `
AI CAREER DIGEST — 2026-09-08

PIPELINE SUMMARY
  Jobs scanned:          185
  After deduplication:   173
  Scored:                173
  Opportunities (≥50):   15

TRENDING COMPANIES THIS WEEK
  Waymo: 49 new roles
  Databricks: 17 new roles
  OpenAI: 15 new roles

BY COUNTRY
  AE: 1
  IN: 3
  SG: 4

TOP RECOMMENDATION
  Applied AI Engineer — OpenAI
  AE | remote
  Score:   88/100  (high_priority)
  Visa:    available (90/100)
  Salary:  Not listed
  Why:
    • Strong skill match.
    • Sponsorship mentioned.

TOP OPPORTUNITIES (score ≥ 50)
  Applied AI Engineer @ OpenAI (AE) — 88/100
`.trim();

describe('parseDigestBrief', () => {
  it('parses pipeline, trending, countries, and top pick from content_text', () => {
    const brief = parseDigestBrief(SAMPLE);
    expect(brief.date).toBe('2026-09-08');
    expect(brief.pipeline).toEqual({
      discovered: 185,
      afterDedup: 173,
      scored: 173,
      opportunities: 15,
      minScore: 50,
    });
    expect(brief.trending[0]).toEqual({ company: 'Waymo', newRoles: 49 });
    expect(brief.countries.map((c) => c.country)).toEqual(['SG', 'IN', 'AE']);
    expect(brief.top?.title).toBe('Applied AI Engineer');
    expect(brief.top?.company).toBe('OpenAI');
    expect(brief.top?.score).toBe(88);
  });

  it('prefers structured metrics_json brief when present', () => {
    const brief = parseDigestBrief(SAMPLE, {
      discovered: 10,
      brief: {
        discovered: 10,
        after_dedup: 8,
        scored: 8,
        top_count: 2,
        min_score: 50,
        trending: [{ company: 'Acme', new_roles: 3 }],
        countries: [{ country: 'US', count: 2 }],
        top: {
          title: 'Backend Engineer',
          company: 'Acme',
          location: 'US',
          remote: 'hybrid',
          score: 91,
          classification: 'apply_immediately',
          visa_status: 'available',
          visa_score: 80,
          salary: '$120k',
          fit_reasoning: 'Great fit',
          visa_reasoning: 'OK',
        },
      },
    });
    expect(brief.pipeline.discovered).toBe(10);
    expect(brief.trending).toEqual([{ company: 'Acme', newRoles: 3 }]);
    expect(brief.top?.title).toBe('Backend Engineer');
  });
});
