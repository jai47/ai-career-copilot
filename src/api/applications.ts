import { apiDelete, apiGet, apiPatch, apiPost } from './client';
import type {
  ApplicationListResponse,
  ApplicationResponse,
  ApplicationUpdate,
  InterviewPrepResponse,
  ThemesResponse,
  TimelineResponse,
  FollowUpDraftResponse,
} from '../types';

export function listApplications(
  token: string,
  signal?: AbortSignal,
): Promise<ApplicationListResponse> {
  return apiGet<ApplicationListResponse>(token, '/applications', undefined, signal);
}

export function updateApplication(
  token: string,
  id: string,
  payload: ApplicationUpdate,
  signal?: AbortSignal,
): Promise<ApplicationResponse> {
  return apiPatch<ApplicationResponse>(token, `/applications/${id}`, payload, signal);
}

export function deleteApplication(
  token: string,
  id: string,
  signal?: AbortSignal,
): Promise<void> {
  return apiDelete<void>(token, `/applications/${id}`, signal);
}

export function getFollowUpDraft(
  token: string,
  applicationId: string,
  signal?: AbortSignal,
): Promise<FollowUpDraftResponse> {
  return apiGet<FollowUpDraftResponse>(
    token,
    `/applications/${applicationId}/follow-up-draft`,
    undefined,
    signal,
  );
}

export function personaliseFollowUpDraft(
  token: string,
  applicationId: string,
  signal?: AbortSignal,
): Promise<FollowUpDraftResponse> {
  return apiPost<FollowUpDraftResponse>(
    token,
    `/applications/${applicationId}/follow-up-draft/personalise`,
    {},
    signal,
  );
}

export function getApplicationTimeline(
  token: string,
  applicationId: string,
  signal?: AbortSignal,
): Promise<TimelineResponse> {
  return apiGet<TimelineResponse>(
    token,
    `/applications/${applicationId}/timeline`,
    undefined,
    signal,
  );
}

export function getApplicationThemes(
  token: string,
  applicationId: string,
  signal?: AbortSignal,
): Promise<ThemesResponse> {
  return apiGet<ThemesResponse>(
    token,
    `/applications/${applicationId}/themes`,
    undefined,
    signal,
  );
}

export function retryApplicationThemes(
  token: string,
  applicationId: string,
  signal?: AbortSignal,
): Promise<{ status: string }> {
  return apiPost<{ status: string }>(
    token,
    `/applications/${applicationId}/themes/retry`,
    {},
    signal,
  );
}

export function getInterviewPrep(
  token: string,
  applicationId: string,
  signal?: AbortSignal,
): Promise<InterviewPrepResponse> {
  return apiGet<InterviewPrepResponse>(
    token,
    `/applications/${applicationId}/interview-prep`,
    undefined,
    signal,
  );
}
