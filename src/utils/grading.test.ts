import { describe, expect, it } from 'vitest';
import { gradeFromScore, isBelowThreshold } from './grading';

describe('gradeFromScore', () => {
  it('returns null for null/undefined scores', () => {
    expect(gradeFromScore(null)).toBeNull();
    expect(gradeFromScore(undefined)).toBeNull();
  });

  it('maps boundary scores with >= comparisons', () => {
    expect(gradeFromScore(85)?.grade).toBe('A');
    expect(gradeFromScore(84.9)?.grade).toBe('B');
    expect(gradeFromScore(70)?.grade).toBe('B');
    expect(gradeFromScore(69.9)?.grade).toBe('C');
    expect(gradeFromScore(55)?.grade).toBe('C');
    expect(gradeFromScore(54.9)?.grade).toBe('D');
    expect(gradeFromScore(40)?.grade).toBe('D');
    expect(gradeFromScore(39.9)?.grade).toBe('F');
    expect(gradeFromScore(0)?.grade).toBe('F');
  });

  it('clamps out-of-range values', () => {
    expect(gradeFromScore(150)?.grade).toBe('A');
    expect(gradeFromScore(-5)?.grade).toBe('F');
  });
});

describe('isBelowThreshold', () => {
  it('returns false when score is null', () => {
    expect(isBelowThreshold(null, 40)).toBe(false);
  });

  it('compares strictly below threshold', () => {
    expect(isBelowThreshold(39, 40)).toBe(true);
    expect(isBelowThreshold(40, 40)).toBe(false);
    expect(isBelowThreshold(41, 40)).toBe(false);
  });
});
