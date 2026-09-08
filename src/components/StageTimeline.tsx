import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getApplicationTimeline } from '../api/applications';
import type { StageEvent } from '../types';

interface StageTimelineProps {
  applicationId: string;
}

function formatEvent(e: StageEvent): string {
  const parts: string[] = [];
  if (e.from_status || e.to_status) {
    parts.push(`${e.from_status ?? '—'} → ${e.to_status ?? '—'}`);
  }
  if (e.from_sub || e.to_sub) {
    parts.push(`sub: ${e.from_sub ?? '—'} → ${e.to_sub ?? '—'}`);
  }
  return parts.join(' · ') || 'Initial state';
}

export default function StageTimeline({ applicationId }: StageTimelineProps) {
  const { token } = useAuth();
  const [events, setEvents] = useState<StageEvent[]>([]);

  useEffect(() => {
    if (!token) return;
    getApplicationTimeline(token, applicationId).then((r) => setEvents(r.events));
  }, [token, applicationId]);

  if (!events.length) return null;

  return (
    <div className="border border-line rounded-xl p-3">
      <h4 className="text-[14px] font-medium text-accent mb-2">
        Stage timeline
      </h4>
      <ul className="space-y-1.5 max-h-40 overflow-y-auto">
        {events.map((e, i) => (
          <li key={i} className="text-[10px] text-muted font-mono">
            <span className="text-slate-600">{formatEvent(e)}</span>
            {e.occurred_at && (
              <span className="ml-2 text-slate-400">
                {new Date(e.occurred_at).toLocaleDateString()}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
