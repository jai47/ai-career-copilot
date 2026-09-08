import { apiGet, apiPost } from './client';
import type { AuthStatusResponse, LoginRequest, LoginResponse, SetupRequest } from '../types';

export function getAuthStatus(signal?: AbortSignal): Promise<AuthStatusResponse> {
  return apiGet<AuthStatusResponse>(null, '/auth/status', undefined, signal);
}

export function login(payload: LoginRequest, signal?: AbortSignal): Promise<LoginResponse> {
  return apiPost<LoginResponse>(null, '/auth/login', payload, signal);
}

export function setupFirstUser(payload: SetupRequest, signal?: AbortSignal): Promise<LoginResponse> {
  return apiPost<LoginResponse>(null, '/auth/setup', payload, signal);
}

export function register(payload: SetupRequest, signal?: AbortSignal): Promise<LoginResponse> {
  return apiPost<LoginResponse>(null, '/auth/register', payload, signal);
}
