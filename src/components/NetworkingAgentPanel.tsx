import { useState } from 'react';
import { Bot, MessageSquare, Pause, Play, Reply } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAsync } from '../hooks/useAsync';
import { ApiError } from '../api/client';
import {
  enrollNetworkingAgent,
  getNetworkingAgentQueue,
  markNetworkingAgentReplied,
  pauseNetworkingAgent,
  processNetworkingAgent,
  runConversationAssistant,
} from '../api/networks';
import type { ConversationAssistantResponse, NetworkingAgentQueueResponse } from '../types';
import { EmptyState, ErrorState, LoadingState } from './ui/AsyncStates';

export default function NetworkingAgentPanel() {
  const { token } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [thread, setThread] = useState('');
  const [voice, setVoice] = useState('');
  const [conversation, setConversation] = useState<ConversationAssistantResponse | null>(null);
  const [localQueue, setLocalQueue] = useState<NetworkingAgentQueueResponse | null>(null);

  const queue = useAsync(
    (signal) => {
      if (!token) return Promise.reject(new Error('Not authenticated'));
      return getNetworkingAgentQueue(token, signal);
    },
    [token],
    Boolean(token),
  );

  const data = localQueue ?? queue.data;

  const run = async (fn: () => Promise<NetworkingAgentQueueResponse>) => {
    setBusy(true);
    setError(null);
    try {
      setLocalQueue(await fn());
      await queue.refetch();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Agent action failed');
    } finally {
      setBusy(false);
    }
  };

  if (queue.loading && !data) return <LoadingState />;
  if (queue.error) return <ErrorState message={queue.error} onRetry={queue.refetch} />;

  return (
    <div className="space-y-4">
      <div className="border border-line bg-surface p-4 space-y-3">
        <h3 className="section-label flex items-center gap-2">
          <Bot className="w-4 h-4" /> AI Networking Agent
        </h3>
        <p className="text-[11px] text-slate-400">
          Auto-sequences connect → follow-up → nudge drafts until you mark a reply. You (or the
          Chrome extension) still click Send on LinkedIn.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy || !token}
            onClick={() => token && void run(() => processNetworkingAgent(token))}
            className="section-label px-3 py-2 border border-accent/30 text-accent bg-accent-soft disabled:opacity-50"
          >
            Process due actions
          </button>
        </div>
        {data?.tip && <p className="text-[10px] text-slate-400">{data.tip}</p>}
        {error && <p className="text-xs text-red-600">{error}</p>}

        <div className="text-xs space-y-2">
          <p className="text-slate-500">
            Enrolled {data?.enrolled.length ?? 0} · Ready {data?.ready_to_send.length ?? 0} · Upcoming{' '}
            {data?.upcoming.length ?? 0}
          </p>
          {(data?.ready_to_send ?? []).map((item) => (
            <div key={item.contact.id} className="border border-line bg-soft p-2 space-y-1">
              <p className="text-ink">
                {item.contact.person_name} · {item.action_type}
              </p>
              <p className="text-slate-600 whitespace-pre-wrap">{item.message}</p>
              <div className="flex flex-wrap gap-2">
                <a
                  href={item.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent text-[13px] font-medium"
                >
                  Open LinkedIn
                </a>
                <button
                  type="button"
                  className="text-[13px] font-medium text-slate-500"
                  onClick={() => void navigator.clipboard.writeText(item.message || '')}
                >
                  Copy
                </button>
                {token && (
                  <button
                    type="button"
                    className="text-[13px] font-medium text-emerald-700 inline-flex items-center gap-1"
                    onClick={() =>
                      void run(async () => {
                        await markNetworkingAgentReplied(token, item.contact.id);
                        return getNetworkingAgentQueue(token);
                      })
                    }
                  >
                    <Reply className="w-3 h-3" /> Got reply
                  </button>
                )}
              </div>
            </div>
          ))}
          {(data?.enrolled ?? []).length === 0 && (
            <EmptyState message="Enroll contacts from My Networks cards (Start agent)." />
          )}
          {(data?.enrolled ?? []).map((c) => (
            <div
              key={c.id}
              className="flex flex-wrap items-center justify-between gap-2 border border-line px-2 py-1"
            >
              <span className="text-slate-700">
                {c.person_name} · {c.agent_step || '—'} · nudges {c.nudge_count}
              </span>
              {token && (
                <button
                  type="button"
                  className="text-[13px] font-medium text-amber-700 inline-flex items-center gap-1"
                  onClick={() =>
                    void run(async () => {
                      await pauseNetworkingAgent(token, c.id);
                      return getNetworkingAgentQueue(token);
                    })
                  }
                >
                  <Pause className="w-3 h-3" /> Pause
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="border border-line bg-surface p-4 space-y-3">
        <h3 className="section-label flex items-center gap-2">
          <MessageSquare className="w-4 h-4" /> LinkedIn Conversation Assistant
        </h3>
        <textarea
          value={thread}
          onChange={(e) => setThread(e.target.value)}
          rows={5}
          placeholder="Paste a LinkedIn message thread…"
          className="w-full bg-soft border border-line px-3 py-2 text-sm text-ink"
        />
        <input
          value={voice}
          onChange={(e) => setVoice(e.target.value)}
          placeholder="Optional voice notes (warm, concise, no buzzwords…)"
          className="w-full bg-soft border border-line px-3 py-2 text-sm text-ink"
        />
        <button
          type="button"
          disabled={busy || !token}
          onClick={async () => {
            if (!token) return;
            setBusy(true);
            setError(null);
            try {
              setConversation(
                await runConversationAssistant(token, {
                  thread_text: thread.trim(),
                  voice_notes: voice.trim() || null,
                }),
              );
            } catch (err) {
              setError(err instanceof ApiError ? err.message : 'Conversation assist failed');
            } finally {
              setBusy(false);
            }
          }}
          className="section-label px-3 py-2 border border-accent/30 text-accent bg-accent-soft disabled:opacity-50"
        >
          Draft replies like me
        </button>
        {conversation && (
          <ul className="space-y-2 text-xs">
            {conversation.intent && (
              <p className="text-slate-400">Intent: {conversation.intent}</p>
            )}
            {conversation.drafts.map((d) => (
              <li key={d.tone + d.body.slice(0, 12)} className="border border-line bg-soft p-2">
                <div className="flex justify-between text-[13px] font-medium text-accent">
                  <span>{d.tone}</span>
                  <button type="button" onClick={() => void navigator.clipboard.writeText(d.body)}>
                    Copy
                  </button>
                </div>
                <p className="text-ink whitespace-pre-wrap mt-1">{d.body}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/** Small enroll button for a contact id */
export function EnrollAgentButton({ contactId }: { contactId: string }) {
  const { token } = useAuth();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  if (!token) return null;
  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        setMsg(null);
        try {
          await enrollNetworkingAgent(token, contactId);
          setMsg('Agent enrolled');
        } catch (err) {
          setMsg(err instanceof ApiError ? err.message : 'Failed');
        } finally {
          setBusy(false);
        }
      }}
      className="text-[14px] font-medium text-accent inline-flex items-center gap-1"
    >
      <Play className="w-3 h-3" /> {busy ? '…' : msg || 'Start agent'}
    </button>
  );
}
