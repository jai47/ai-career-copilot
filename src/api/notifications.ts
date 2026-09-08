import { apiGet, apiPost } from './client';
import type { NotificationListResponse } from '../types';

export function listNotifications(
  token: string,
  params?: { unread_only?: boolean; page?: number },
  signal?: AbortSignal,
): Promise<NotificationListResponse> {
  return apiGet<NotificationListResponse>(token, '/notifications', params, signal);
}

export function markNotificationRead(
  token: string,
  id: string,
  signal?: AbortSignal,
): Promise<void> {
  return apiPost<void>(token, `/notifications/${id}/read`, {}, signal);
}

export function markAllNotificationsRead(token: string, signal?: AbortSignal): Promise<void> {
  return apiPost<void>(token, '/notifications/read-all', {}, signal);
}
