import { useState } from 'react';
import { CheckCircle2, Circle, Copy, ExternalLink, Package } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAsync } from '../hooks/useAsync';
import { ensureApplyPacket, generateFormAnswers, getApplyPacket } from '../api/autopilot';
import { ApiError, API_URL } from '../api/client';
import { EmptyState, ErrorState, LoadingState } from './ui/AsyncStates';

interface ApplyPacketPanelProps {
  applicationId: string;
}

export default function ApplyPacketPanel({ applicationId }: ApplyPacketPanelProps) {
  const { token } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [questionsText, setQuestionsText] = useState('');
  const [formBusy, setFormBusy] = useState(false);

  const packet = useAsync(
    (signal) => {
      if (!token) return Promise.reject(new Error('Not authenticated'));
      return getApplyPacket(token, applicationId, signal);
    },
    [token, applicationId],
    Boolean(token),
  );

  const handleEnsure = async () => {
    if (!token) return;
    setBusy(true);
    setError(null);
    try {
      await ensureApplyPacket(token, applicationId);
      await packet.refetch();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not ensure packet');
    } finally {
      setBusy(false);
    }
  };

  const copyNote = async () => {
    if (!packet.data?.connect_note) return;
    await navigator.clipboard.writeText(packet.data.connect_note);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFormAnswers = async () => {
    if (!token) return;
    const questions = questionsText
      .split('\n')
      .map((q) => q.trim())
      .filter(Boolean)
      .map((prompt) => ({ prompt }));
    if (!questions.length) {
      setError('Enter one form question per line.');
      return;
    }
    setFormBusy(true);
    setError(null);
    try {
      await generateFormAnswers(token, applicationId, { questions });
      await packet.refetch();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not draft form answers');
    } finally {
      setFormBusy(false);
    }
  };

  if (packet.loading && !packet.data) return <LoadingState />;
  if (packet.error) return <ErrorState message={packet.error} onRetry={packet.refetch} />;
  if (!packet.data) return <EmptyState message="No apply packet yet." />;

  const data = packet.data;
  const formAnswers = (data.form_answers || []) as Array<{
    id?: string;
    question?: string;
    answer?: string;
    tips?: string;
  }>;

  return (
    <div className="border border-line bg-surface p-4 space-y-3 rounded-[18px]">
      <div className="flex items-center justify-between gap-2">
        <h3 className="section-label flex items-center gap-2">
          <Package className="w-4 h-4" /> Apply Packet
        </h3>
        <span className={`text-[13px] font-medium ${data.ready ? 'text-emerald-700' : 'text-amber-700'}`}>
          {data.ready ? 'Ready' : 'Incomplete'}
        </span>
      </div>
      <p className="text-[13px] text-muted">
        Resume + cover letter + LinkedIn note + form drafts for {data.title} @ {data.company}. You
        still submit applications yourself.
      </p>
      <ul className="space-y-1">
        {data.checklist.map((item) => (
          <li key={item.key} className="text-[14px] flex items-center gap-2 text-ink">
            {item.done ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <Circle className="w-3.5 h-3.5 text-slate-300" />
            )}
            <span>{item.label}</span>
            {item.href && item.key === 'job_link' && (
              <a href={item.href} target="_blank" rel="noopener noreferrer" className="text-accent">
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
            {item.href && item.key !== 'job_link' && (
              <a
                href={`${API_URL}${item.href}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent text-[12px]"
              >
                open
              </a>
            )}
          </li>
        ))}
      </ul>
      {data.connect_note && (
        <div className="bg-soft border border-line p-3 text-[14px] text-ink whitespace-pre-wrap rounded-[12px]">
          {data.connect_note}
          <button
            type="button"
            onClick={() => void copyNote()}
            className="mt-2 flex items-center gap-1 text-[13px] font-medium text-accent"
          >
            <Copy className="w-3 h-3" /> {copied ? 'Copied' : 'Copy note'}
          </button>
        </div>
      )}

      <div className="border-t border-line pt-3 space-y-2">
        <p className="section-label">Application form answers</p>
        <textarea
          value={questionsText}
          onChange={(e) => setQuestionsText(e.target.value)}
          rows={3}
          placeholder={'Paste open-ended questions, one per line\nWhy do you want this role?\nTell us about a hard problem you solved'}
          className="w-full text-[14px] px-3 py-2 rounded-[12px] border border-line bg-soft"
        />
        <button
          type="button"
          disabled={formBusy}
          onClick={() => void handleFormAnswers()}
          className="px-4 py-2 text-[14px] font-medium rounded-full border border-line disabled:opacity-50"
        >
          {formBusy ? 'Drafting…' : 'Draft answers'}
        </button>
        {formAnswers.length > 0 && (
          <ul className="space-y-3">
            {formAnswers.map((a, i) => (
              <li key={a.id || String(i)} className="bg-soft border border-line rounded-[12px] p-3">
                <p className="text-[13px] font-medium text-ink">{a.question}</p>
                <p className="text-[14px] text-muted mt-2 whitespace-pre-wrap">{a.answer}</p>
                {a.tips && <p className="text-[12px] text-accent mt-2">{a.tips}</p>}
                <button
                  type="button"
                  className="mt-2 text-[13px] text-accent font-medium"
                  onClick={() => void navigator.clipboard.writeText(String(a.answer || ''))}
                >
                  Copy answer
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {data.ats_score_after != null && (
        <p className="text-[12px] text-muted">
          ATS {data.ats_score_before ?? '—'} → {data.ats_score_after}
        </p>
      )}
      {error && <p className="text-[13px] text-[#b00020]">{error}</p>}
      <button
        type="button"
        disabled={busy}
        onClick={() => void handleEnsure()}
        className="section-label px-3 py-2 border border-accent/30 text-accent bg-accent-soft disabled:opacity-50 rounded-full"
      >
        {busy ? 'Preparing…' : 'Ensure packet'}
      </button>
    </div>
  );
}
