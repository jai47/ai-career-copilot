import { apiGet, apiPost } from './client';
import type {
  FindNetworkRequest,
  FindNetworkResponse,
  ImportContactsRequest,
  ImportContactsResponse,
  LinkedInProfileAnalyzeRequest,
  LinkedInProfileAnalysisResponse,
} from '../types';

export function getLinkedInProfileAnalysis(
  token: string,
  signal?: AbortSignal,
): Promise<LinkedInProfileAnalysisResponse> {
  return apiGet<LinkedInProfileAnalysisResponse>(token, '/linkedin/profile-analysis', undefined, signal);
}

export function analyzeLinkedInProfile(
  token: string,
  payload: LinkedInProfileAnalyzeRequest,
  signal?: AbortSignal,
): Promise<LinkedInProfileAnalysisResponse> {
  return apiPost<LinkedInProfileAnalysisResponse>(
    token,
    '/linkedin/profile-analysis',
    payload,
    signal,
  );
}

export function findNetworkSuggestions(
  token: string,
  payload: FindNetworkRequest,
  signal?: AbortSignal,
): Promise<FindNetworkResponse> {
  return apiPost<FindNetworkResponse>(token, '/linkedin/find-network', payload, signal);
}

export function importLinkedInContacts(
  token: string,
  payload: ImportContactsRequest,
  signal?: AbortSignal,
): Promise<ImportContactsResponse> {
  return apiPost<ImportContactsResponse>(token, '/linkedin/import-contacts', payload, signal);
}
