import { apiGet, apiPost } from './client';
import type { LLMUsageResponse, PipelineRunListResponse, PipelineRunResponse } from '../types';

export function getPipelineRuns(
  token: string,
  signal?: AbortSignal,
): Promise<PipelineRunListResponse> {
  return apiGet<PipelineRunListResponse>(token, '/pipeline/runs', undefined, signal);
}

export function triggerPipelineRun(
  token: string,
  signal?: AbortSignal,
): Promise<PipelineRunResponse> {
  return apiPost<PipelineRunResponse>(token, '/pipeline/run', undefined, signal, 30_000);
}

export function continuePipelineRun(
  token: string,
  signal?: AbortSignal,
): Promise<PipelineRunResponse> {
  return apiPost<PipelineRunResponse>(token, '/pipeline/continue', undefined, signal, 30_000);
}

export function cancelPipelineRun(
  token: string,
  signal?: AbortSignal,
): Promise<PipelineRunResponse> {
  return apiPost<PipelineRunResponse>(token, '/pipeline/cancel', undefined, signal, 30_000);
}

export function getLlmUsage(token: string, signal?: AbortSignal): Promise<LLMUsageResponse> {
  return apiGet<LLMUsageResponse>(token, '/pipeline/llm-usage', undefined, signal);
}

export function getPipelineStages(
  token: string,
  signal?: AbortSignal,
): Promise<Record<string, string>> {
  return apiGet<Record<string, string>>(token, '/pipeline/stages', undefined, signal);
}
