import { apiGet } from './client';
import type { DigestResponse } from '../types';

export function getTodayDigest(token: string, signal?: AbortSignal): Promise<DigestResponse> {
  return apiGet<DigestResponse>(token, '/digest/today', undefined, signal);
}
