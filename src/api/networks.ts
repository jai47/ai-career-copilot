import { apiDelete, apiGet, apiPatch, apiPost } from './client';
import type {
  ConversationAssistantRequest,
  ConversationAssistantResponse,
  NetworkContactCreate,
  NetworkContactListResponse,
  NetworkContactResponse,
  NetworkContactUpdate,
  NetworkingAgentQueueResponse,
} from '../types';

export function listNetworkContacts(
  token: string,
  params?: {
    status?: string;
    company?: string;
    application_id?: string;
  },
  signal?: AbortSignal,
): Promise<NetworkContactListResponse> {
  return apiGet<NetworkContactListResponse>(token, '/networks', params, signal);
}

export function createNetworkContact(
  token: string,
  payload: NetworkContactCreate,
  signal?: AbortSignal,
): Promise<NetworkContactResponse> {
  return apiPost<NetworkContactResponse>(token, '/networks', payload, signal);
}

export function updateNetworkContact(
  token: string,
  contactId: string,
  payload: NetworkContactUpdate,
  signal?: AbortSignal,
): Promise<NetworkContactResponse> {
  return apiPatch<NetworkContactResponse>(token, `/networks/${contactId}`, payload, signal);
}

export function deleteNetworkContact(
  token: string,
  contactId: string,
  signal?: AbortSignal,
): Promise<void> {
  return apiDelete<void>(token, `/networks/${contactId}`, signal);
}

export function draftNetworkContact(
  token: string,
  contactId: string,
  signal?: AbortSignal,
): Promise<NetworkContactResponse> {
  return apiPost<NetworkContactResponse>(token, `/networks/${contactId}/draft`, {}, signal);
}

export function markNetworkContactSent(
  token: string,
  contactId: string,
  signal?: AbortSignal,
): Promise<NetworkContactResponse> {
  return apiPost<NetworkContactResponse>(token, `/networks/${contactId}/mark-sent`, {}, signal);
}

export function getNetworkingAgentQueue(token: string, signal?: AbortSignal) {
  return apiGet<NetworkingAgentQueueResponse>(token, '/networks/agent/queue', undefined, signal);
}

export function processNetworkingAgent(token: string, signal?: AbortSignal) {
  return apiPost<NetworkingAgentQueueResponse>(token, '/networks/agent/process', {}, signal);
}

export function enrollNetworkingAgent(token: string, contactId: string, signal?: AbortSignal) {
  return apiPost<NetworkContactResponse>(
    token,
    `/networks/${contactId}/agent/enroll`,
    {},
    signal,
  );
}

export function pauseNetworkingAgent(token: string, contactId: string, signal?: AbortSignal) {
  return apiPost<NetworkContactResponse>(token, `/networks/${contactId}/agent/pause`, {}, signal);
}

export function markNetworkingAgentReplied(token: string, contactId: string, signal?: AbortSignal) {
  return apiPost<NetworkContactResponse>(
    token,
    `/networks/${contactId}/agent/replied`,
    {},
    signal,
  );
}

export function runConversationAssistant(
  token: string,
  payload: ConversationAssistantRequest,
  signal?: AbortSignal,
) {
  return apiPost<ConversationAssistantResponse>(token, '/networks/conversation', payload, signal);
}
