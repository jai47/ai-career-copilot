import { useState } from 'react';
import { Copy, Inbox } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { runReplyCoach } from '../api/autopilot';
import { ApiError } from '../api/client';
import type { ReplyCoachResponse } from '../types';

interface ReplyCoachPanelProps {
  applicationId?: string;
}

export default function ReplyCoachPanel({ applicationId }: ReplyCoachPanelProps) {
  const { token } = useAuth();
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ReplyCoachResponse | null>(null);

  const handleRun = async () => {
    if (!token || message.trim().length < 10) {
      setError('Paste at least ~10 characters of the recruiter message.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const data = await runReplyCoach(token, {
        message: message.trim(),
        application_id: applicationId || null,
      });
      setResult(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Reply coach failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="border border-line bg-surface p-4 space-y-3">
      <h3 className="section-label flex items-center gap-2">
        <Inbox className="w-4 h-4" /> Reply Coach
      </h3>
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={4}
        placeholder="Paste a recruiter email or LinkedIn message…"
        className="w-full bg-soft border border-line px-3 py-2 text-sm text-ink"
      />
      <button
        type="button"
        disabled={busy}
        onClick={() => void handleRun()}
        className="section-label px-3 py-2 border border-accent/30 text-accent bg-accent-soft disabled:opacity-50"
      >
        {busy ? 'Drafting…' : 'Draft replies'}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
      {result && (
        <div className="space-y-2">
          {result.suggested_status && (
            <p className="text-[10px] text-slate-400">
              Suggested tracker status: {result.suggested_status}
            </p>
          )}
          {result.drafts.map((d) => (
            <div key={d.tone + d.body.slice(0, 20)} className="border border-line bg-soft p-2">
              <div className="flex justify-between text-[13px] font-medium text-accent">
                <span>{d.tone}</span>
                <button
                  type="button"
                  onClick={() => void navigator.clipboard.writeText(d.body)}
                  className="inline-flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" /> Copy
                </button>
              </div>
              <p className="text-xs text-ink whitespace-pre-wrap mt-1">{d.body}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
