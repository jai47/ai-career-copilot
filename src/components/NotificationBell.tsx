import { useCallback, useEffect, useRef, useState } from 'react';
import { Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { listNotifications, markAllNotificationsRead, markNotificationRead } from '../api/notifications';
import type { NotificationItem } from '../types';

interface NotificationBellProps {
  onFollowUp?: (applicationId: string) => void;
}

export default function NotificationBell({ onFollowUp }: NotificationBellProps) {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);

  const refresh = useCallback(async () => {
    if (!token) return;
    try {
      const data = await listNotifications(token);
      setItems(data.items);
      setUnreadCount(data.unread_count);
    } catch {
      /* ignore poll errors */
    }
  }, [token]);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 30_000);
    return () => clearInterval(interval);
  }, [refresh]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const handleItemClick = async (item: NotificationItem) => {
    if (!token) return;
    if (!item.read_at) {
      try {
        await markNotificationRead(token, item.id);
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch {
        /* best-effort */
      }
    }
    setOpen(false);
    const link = item.link_path ?? (item.type === 'pipeline_status' ? '/status' : '/tracker');
    if (item.type === 'pipeline_status') {
      navigate('/status');
      return;
    }
    const appMatch = link.match(/application=([a-f0-9-]+)/i);
    if (item.type === 'follow_up' && appMatch && onFollowUp) {
      onFollowUp(appMatch[1]);
      return;
    }
    navigate(link.split('?')[0]);
  };

  const handleMarkAll = async () => {
    if (!token) return;
    try {
      await markAllNotificationsRead(token);
      setUnreadCount(0);
      setItems((prev) => prev.map((i) => ({ ...i, read_at: i.read_at ?? new Date().toISOString() })));
    } catch {
      /* best-effort */
    }
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-full hover:bg-black/[0.04] transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-[18px] h-[18px] text-muted" strokeWidth={1.75} />
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-accent text-[10px] font-semibold text-white flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-[340px] max-h-96 overflow-y-auto bg-surface border border-line rounded-[18px] shadow-[0_20px_40px_rgba(0,0,0,0.12)] z-50">
          <div className="flex items-center justify-between px-5 py-4 border-b border-line">
            <span className="text-[15px] font-semibold tracking-[-0.02em] text-ink">Notifications</span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAll}
                className="text-[13px] text-accent font-medium hover:underline underline-offset-2"
              >
                Mark all read
              </button>
            )}
          </div>
          {items.length === 0 ? (
            <p className="px-5 py-8 text-[14px] text-muted">No notifications yet.</p>
          ) : (
            <ul>
              {items.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => handleItemClick(item)}
                    className={`w-full text-left px-5 py-3.5 border-b border-line hover:bg-soft transition-colors ${
                      !item.read_at ? 'bg-accent-soft/40' : ''
                    }`}
                  >
                    <p className="text-[14px] font-medium text-ink tracking-[-0.01em]">{item.title}</p>
                    <p className="text-[13px] text-muted mt-0.5 line-clamp-2">{item.body}</p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
