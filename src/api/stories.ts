import { apiDelete, apiGet, apiPost, apiPut } from './client';
import type { StoryListResponse, StoryResponse } from '../types';

export function listStories(
  token: string,
  params?: { tag?: string; status?: string; q?: string; page?: number },
  signal?: AbortSignal,
): Promise<StoryListResponse> {
  return apiGet<StoryListResponse>(token, '/stories', params, signal);
}

export function createStory(
  token: string,
  body: Record<string, unknown>,
  signal?: AbortSignal,
): Promise<StoryResponse> {
  return apiPost<StoryResponse>(token, '/stories', body, signal);
}

export function updateStory(
  token: string,
  id: string,
  body: Record<string, unknown>,
  signal?: AbortSignal,
): Promise<StoryResponse> {
  return apiPut<StoryResponse>(token, `/stories/${id}`, body, signal);
}

export function deleteStory(token: string, id: string, signal?: AbortSignal): Promise<void> {
  return apiDelete<void>(token, `/stories/${id}`, signal);
}

export function draftStoryWithAi(
  token: string,
  tag: string,
  applicationId?: string,
  signal?: AbortSignal,
): Promise<StoryResponse> {
  return apiPost<StoryResponse>(
    token,
    '/stories/draft',
    { tag, application_id: applicationId ?? null },
    signal,
  );
}
