import { apiGet, apiPost } from './client';
import type {
  OpportunityActionResponse,
  OpportunityDetail,
  OpportunityListResponse,
  RejectRequest,
} from '../types';

export interface OpportunityListParams {
  page?: number;
  page_size?: number;
  country?: string;
  countries?: string;
  visa_status?: string;
  visa_statuses?: string;
  classification?: string;
  classifications?: string;
  min_score?: number;
  archetype?: string;
  archetypes?: string;
  min_salary_usd?: number;
  exclude_suspicious?: boolean;
  date_from?: string;
  date_to?: string;
  [key: string]: string | number | boolean | undefined;
}

export function listOpportunities(
  token: string,
  params: OpportunityListParams = {},
  signal?: AbortSignal,
): Promise<OpportunityListResponse> {
  return apiGet<OpportunityListResponse>(token, '/opportunities', params, signal);
}

export function getOpportunity(
  token: string,
  id: string,
  signal?: AbortSignal,
): Promise<OpportunityDetail> {
  return apiGet<OpportunityDetail>(token, `/opportunities/${id}`, undefined, signal);
}

export function approveOpportunity(
  token: string,
  id: string,
  signal?: AbortSignal,
): Promise<OpportunityActionResponse> {
  return apiPost<OpportunityActionResponse>(token, `/opportunities/${id}/approve`, undefined, signal, 180_000);
}

export function rejectOpportunity(
  token: string,
  id: string,
  payload: RejectRequest,
  signal?: AbortSignal,
): Promise<OpportunityActionResponse> {
  return apiPost<OpportunityActionResponse>(token, `/opportunities/${id}/reject`, payload, signal);
}

export function skipOpportunity(
  token: string,
  id: string,
  signal?: AbortSignal,
): Promise<OpportunityActionResponse> {
  return apiPost<OpportunityActionResponse>(token, `/opportunities/${id}/skip`, undefined, signal);
}
