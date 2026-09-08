import { apiGet, apiPatch, apiPost, apiPut, apiDelete } from './client';
import type {
  AdminUserRow,
  BillingRates,
  BillingUsageResponse,
  UserLlmKeysResponse,
} from '../types';

export interface AdminByokProvider {
  id: string;
  label: string;
  configured: boolean;
  key_hint: string | null;
}

export interface AdminUserDetail {
  id: string;
  name: string;
  email: string;
  token_balance: number;
  is_admin: boolean;
  preferred_llm_provider: string | null;
  byok_providers: AdminByokProvider[];
}

export function getBillingUsage(token: string, signal?: AbortSignal): Promise<BillingUsageResponse> {
  return apiGet<BillingUsageResponse>(token, '/billing/usage', undefined, signal);
}

export function getMyLlmKeys(token: string, signal?: AbortSignal): Promise<UserLlmKeysResponse> {
  return apiGet<UserLlmKeysResponse>(token, '/users/me/llm-keys', undefined, signal);
}

export function putMyLlmKey(
  token: string,
  provider: string,
  api_key: string | null,
  model?: string | null,
  signal?: AbortSignal,
): Promise<UserLlmKeysResponse> {
  return apiPut<UserLlmKeysResponse>(
    token,
    '/users/me/llm-keys',
    { provider, api_key: api_key || undefined, model: model || undefined },
    signal,
  );
}

export function deleteMyLlmKey(
  token: string,
  provider: string,
  signal?: AbortSignal,
): Promise<UserLlmKeysResponse> {
  return apiDelete<UserLlmKeysResponse>(token, `/users/me/llm-keys/${provider}`, signal);
}

export function patchLlmPreference(
  token: string,
  provider: string,
  signal?: AbortSignal,
): Promise<UserLlmKeysResponse> {
  return apiPatch<UserLlmKeysResponse>(
    token,
    '/users/me/llm-preference',
    { provider },
    signal,
  );
}

export function adminGetRates(token: string, signal?: AbortSignal): Promise<BillingRates> {
  return apiGet<BillingRates>(token, '/admin/billing-rates', undefined, signal);
}

export function adminPatchRates(
  token: string,
  payload: Partial<BillingRates>,
  signal?: AbortSignal,
): Promise<BillingRates> {
  return apiPatch<BillingRates>(token, '/admin/billing-rates', payload, signal);
}

export function adminListUsers(
  token: string,
  signal?: AbortSignal,
): Promise<{ users: AdminUserRow[] }> {
  return apiGet(token, '/admin/users', undefined, signal);
}

export function adminGetUser(
  token: string,
  userId: string,
  signal?: AbortSignal,
): Promise<AdminUserDetail> {
  return apiGet(token, `/admin/users/${userId}`, undefined, signal);
}

export function adminGrantTokens(
  token: string,
  userId: string,
  amount: number,
  note?: string,
  signal?: AbortSignal,
): Promise<{ user_id: string; token_balance: number; granted: number }> {
  return apiPost(token, `/admin/users/${userId}/grant-tokens`, { amount, note }, signal);
}

export function adminSetAdmin(
  token: string,
  userId: string,
  is_admin: boolean,
  signal?: AbortSignal,
): Promise<{ user_id: string; email: string; is_admin: boolean }> {
  return apiPatch(token, `/admin/users/${userId}/admin`, { is_admin }, signal);
}

export function adminLlmPlatformStatus(token: string, signal?: AbortSignal) {
  return apiGet(token, '/admin/llm-platform-status', undefined, signal);
}
