import { apiGet } from './client';
import type { ApplicationAnalyticsResponse, SkillGapReportResponse } from '../types';

export function getSkillGapReports(
  token: string,
  signal?: AbortSignal,
): Promise<SkillGapReportResponse> {
  return apiGet<SkillGapReportResponse>(token, '/reports/skill-gap', undefined, signal);
}

export function getApplicationAnalytics(
  token: string,
  params?: { date_from?: string; date_to?: string },
  signal?: AbortSignal,
): Promise<ApplicationAnalyticsResponse> {
  return apiGet<ApplicationAnalyticsResponse>(
    token,
    '/reports/application-analytics',
    params,
    signal,
  );
}
