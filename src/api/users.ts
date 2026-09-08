import { apiGet, apiPatch, apiPost, apiPostForm } from './client';
import type {
  BlacklistResponse,
  BlacklistUpdate,
  LLMProviderUpdate,
  LLMStatusResponse,
  ResumeTextUpload,
  ResumeUploadResponse,
  UserProfileResponse,
  UserProfileUpdate,
} from '../types';

export function getProfile(token: string, signal?: AbortSignal): Promise<UserProfileResponse> {
  return apiGet<UserProfileResponse>(token, '/users/me', undefined, signal);
}

export function updateProfile(
  token: string,
  payload: UserProfileUpdate,
  signal?: AbortSignal,
): Promise<UserProfileResponse> {
  return apiPatch<UserProfileResponse>(token, '/users/me', payload, signal);
}

export function uploadResumeFile(
  token: string,
  file: File,
  signal?: AbortSignal,
): Promise<ResumeUploadResponse> {
  const form = new FormData();
  form.append('file', file);
  return apiPostForm<ResumeUploadResponse>(token, '/users/me/resume', form, signal);
}

export function uploadResumeText(
  token: string,
  payload: ResumeTextUpload,
  signal?: AbortSignal,
): Promise<ResumeUploadResponse> {
  return apiPost<ResumeUploadResponse>(token, '/users/me/resume/text', payload, signal, 180_000);
}

export function getBlacklists(token: string, signal?: AbortSignal): Promise<BlacklistResponse> {
  return apiGet<BlacklistResponse>(token, '/users/me/blacklists', undefined, signal);
}

export function updateBlacklists(
  token: string,
  payload: BlacklistUpdate,
  signal?: AbortSignal,
): Promise<BlacklistResponse> {
  return apiPatch<BlacklistResponse>(token, '/users/me/blacklists', payload, signal);
}

export function getLlmStatus(signal?: AbortSignal): Promise<LLMStatusResponse> {
  return apiGet<LLMStatusResponse>(null, '/config/llm-status', undefined, signal);
}

export function updateLlmProvider(
  token: string,
  payload: LLMProviderUpdate,
  signal?: AbortSignal,
): Promise<LLMStatusResponse> {
  return apiPatch<LLMStatusResponse>(token, '/config/llm-provider', payload, signal);
}
