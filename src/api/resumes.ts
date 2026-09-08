import { apiDelete, apiGet, apiGetBytes, apiPost, apiPostBytes, apiPut } from './client';
import type { ResumeVersionItem, ResumeVersionListResponse } from '../types';

export function listResumeVersions(
  token: string,
  signal?: AbortSignal,
): Promise<ResumeVersionListResponse> {
  return apiGet<ResumeVersionListResponse>(token, '/resume-versions', undefined, signal);
}

export function downloadResumePdf(
  token: string,
  versionId: string,
  signal?: AbortSignal,
): Promise<Blob> {
  return apiGetBytes(token, `/resume-versions/${versionId}/pdf`, signal);
}

export function regenerateResumeForApplication(
  token: string,
  applicationId: string,
  signal?: AbortSignal,
): Promise<ResumeVersionItem> {
  return apiPost<ResumeVersionItem>(
    token,
    `/applications/${applicationId}/resume/regenerate`,
    undefined,
    signal,
    180_000,
  );
}

export function ensureResumeLatex(
  token: string,
  versionId: string,
  signal?: AbortSignal,
  force = false,
): Promise<{ latex_source: string }> {
  return apiPost<{ latex_source: string }>(
    token,
    `/resume-versions/${versionId}/latex/ensure`,
    { force },
    signal,
    180_000,
  );
}

export function saveResumeLatex(
  token: string,
  versionId: string,
  latexSource: string,
  signal?: AbortSignal,
): Promise<{ latex_source: string }> {
  return apiPut<{ latex_source: string }>(
    token,
    `/resume-versions/${versionId}/latex`,
    { latex_source: latexSource },
    signal,
  );
}

export function compileResumeLatex(
  token: string,
  versionId: string,
  latexSource?: string,
  signal?: AbortSignal,
): Promise<Blob> {
  return apiPostBytes(
    token,
    `/resume-versions/${versionId}/latex/compile`,
    { latex_source: latexSource ?? null },
    signal,
  );
}

export function deleteResumeVersion(
  token: string,
  versionId: string,
  signal?: AbortSignal,
): Promise<void> {
  return apiDelete<void>(token, `/resume-versions/${versionId}`, signal);
}

export function deleteAllResumeVersions(
  token: string,
  signal?: AbortSignal,
): Promise<{ deleted_count: number }> {
  return apiDelete<{ deleted_count: number }>(token, '/resume-versions/all', signal);
}
