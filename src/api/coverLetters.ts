import { apiGet, apiGetBytes, apiPost, apiPut } from './client';
import type { CoverLetterResponse } from '../types';

export function getCoverLetter(
  token: string,
  applicationId: string,
  signal?: AbortSignal,
): Promise<CoverLetterResponse> {
  return apiGet<CoverLetterResponse>(
    token,
    `/applications/${applicationId}/cover-letter`,
    undefined,
    signal,
  );
}

export function generateCoverLetter(
  token: string,
  applicationId: string,
  signal?: AbortSignal,
): Promise<{ status: string }> {
  return apiPost<{ status: string }>(
    token,
    `/applications/${applicationId}/cover-letter`,
    {},
    signal,
  );
}

export function updateCoverLetter(
  token: string,
  applicationId: string,
  body: string,
  signal?: AbortSignal,
): Promise<CoverLetterResponse> {
  return apiPut<CoverLetterResponse>(
    token,
    `/applications/${applicationId}/cover-letter`,
    { body },
    signal,
  );
}

export function approveCoverLetter(
  token: string,
  applicationId: string,
  signal?: AbortSignal,
): Promise<CoverLetterResponse> {
  return apiPost<CoverLetterResponse>(
    token,
    `/applications/${applicationId}/cover-letter/approve`,
    {},
    signal,
  );
}

export function downloadCoverLetterPdf(
  token: string,
  applicationId: string,
  signal?: AbortSignal,
): Promise<Blob> {
  return apiGetBytes(token, `/applications/${applicationId}/cover-letter/pdf`, signal);
}
