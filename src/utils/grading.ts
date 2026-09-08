/**
 * F02 — map overall_score (0–100) to letter grade bands.
 * Bands: A ≥ 85 · B ≥ 70 · C ≥ 55 · D ≥ 40 · F < 40
 */

export type LetterGrade = 'A' | 'B' | 'C' | 'D' | 'F';

export interface GradeInfo {
  grade: LetterGrade;
  label: string;
  /** Tailwind classes for chip background/border/text */
  chipClass: string;
}

const GRADE_BANDS: { min: number; grade: LetterGrade; label: string; chipClass: string }[] = [
  { min: 85, grade: 'A', label: 'Excellent match', chipClass: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
  { min: 70, grade: 'B', label: 'Strong match', chipClass: 'bg-green-50 border-green-200 text-green-700' },
  { min: 55, grade: 'C', label: 'Moderate match', chipClass: 'bg-sky-50 border-sky-200 text-sky-700' },
  { min: 40, grade: 'D', label: 'Weak match', chipClass: 'bg-amber-50 border-amber-200 text-amber-800' },
  { min: 0, grade: 'F', label: 'Poor match', chipClass: 'bg-red-50 border-red-200 text-red-700' },
];

export function gradeFromScore(score: number | null | undefined): GradeInfo | null {
  if (score == null || Number.isNaN(score)) {
    return null;
  }
  const clamped = Math.max(0, Math.min(100, score));
  for (const band of GRADE_BANDS) {
    if (clamped >= band.min) {
      return { grade: band.grade, label: band.label, chipClass: band.chipClass };
    }
  }
  return GRADE_BANDS[GRADE_BANDS.length - 1];
}

export function isBelowThreshold(
  score: number | null | undefined,
  threshold: number,
): boolean {
  if (score == null || Number.isNaN(score)) {
    return false;
  }
  return score < threshold;
}

export interface ScoreDimensions {
  score_skill_match?: number | null;
  score_role_match?: number | null;
  score_experience?: number | null;
  score_country_pref?: number | null;
  score_remote_pref?: number | null;
  score_fit?: number | null;
}

export const SCORE_DIMENSION_LABELS: { key: keyof ScoreDimensions; label: string }[] = [
  { key: 'score_skill_match', label: 'Skill match' },
  { key: 'score_role_match', label: 'Role match' },
  { key: 'score_experience', label: 'Experience' },
  { key: 'score_country_pref', label: 'Country preference' },
  { key: 'score_remote_pref', label: 'Remote preference' },
  { key: 'score_fit', label: 'Fit (composite)' },
];
