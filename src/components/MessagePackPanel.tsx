import { useState } from 'react';
import { Copy, MessageSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAsync } from '../hooks/useAsync';
import { generateMessagePack, getMessagePack } from '../api/autopilot';
import { ApiError } from '../api/client';
import type { MessagePackResponse } from '../types';
import { ErrorState, LoadingState } from './ui/AsyncStates';

interface MessagePackPanelProps {
  applicationId: string;
}

export default function MessagePackPanel({ applicationId }: MessagePackPanelProps) {
  const { token } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [local, setLocal] = useState<MessagePackResponse | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const pack = useAsync(
    async (signal) => {
      if (!token) return null;
      try {
        return await getMessagePack(token, applicationId, signal);
      } catch (err) {
        if (err instanceof ApiError && err.statusCode === 404) return null;
        throw err;
      }
    },
    [token, applicationId],
    Boolean(token),
  );

  const data = local ?? pack.data;

  const handleGenerate = async () => {
    if (!token) return;
    setBusy(true);
    setError(null);
    try {
      const result = await generateMessagePack(token, applicationId);
      setLocal(result);
      await pack.refetch();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Generation failed');
    } finally {
      setBusy(false);
    }
  };

  const copyBody = async (key: string, body: string) => {
    await navigator.clipboard.writeText(body);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  if (pack.loading && !data) return <LoadingState />;
  if (pack.error) return <ErrorState message={pack.error} onRetry={pack.refetch} />;

  return (
    <div className="border border-line bg-surface p-4 space-y-3">
      <h3 className="section-label flex items-center gap-2">
        <MessageSquare className="w-4 h-4" /> Message Pack / Sequences
      </h3>
      <p className="text-[11px] text-slate-400">
        Connect, day-7/14 follow-ups, referral, thank-you, and nudge drafts. Copy and send yourself.
      </p>
      <button
        type="button"
        disabled={busy}
        onClick={() => void handleGenerate()}
        className="section-label px-3 py-2 border border-accent/30 text-accent bg-accent-soft disabled:opacity-50"
      >
        {busy ? 'Generating…' : data ? 'Regenerate pack' : 'Generate message pack'}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
      {data && (
        <ul className="space-y-2">
          {data.messages.map((m) => (
            <li key={m.key} className="border border-line bg-soft p-2">
              <div className="flex justify-between text-[14px] font-medium text-accent">
                <span>
                  {m.label} · {m.channel}
                  {m.day_offset ? ` · D+${m.day_offset}` : ''}
                </span>
                <button
                  type="button"
                  onClick={() => void copyBody(m.key, m.body)}
                  className="inline-flex items-center gap-1 text-slate-500"
                >
                  <Copy className="w-3 h-3" />
                  {copiedKey === m.key ? 'Copied' : 'Copy'}
                </button>
              </div>
              <p className="text-xs text-ink mt-1 whitespace-pre-wrap">{m.body}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
