import { useEffect, useState } from 'react';
import { Download, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAsync } from '../hooks/useAsync';
import {
  approveCoverLetter,
  downloadCoverLetterPdf,
  generateCoverLetter,
  getCoverLetter,
  updateCoverLetter,
} from '../api/coverLetters';
import { ApiError } from '../api/client';
import { ErrorState, LoadingState } from './ui/AsyncStates';

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pending',
  generating: 'Generating…',
  draft: 'Draft',
  approved: 'Approved',
  failed: 'Failed',
};

interface CoverLetterPanelProps {
  applicationId: string;
  company: string;
  title: string;
}

export default function CoverLetterPanel({ applicationId, company, title }: CoverLetterPanelProps) {
  const { token } = useAuth();
  const [body, setBody] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const letter = useAsync(
    async (signal) => {
      if (!token) return null;
      try {
        return await getCoverLetter(token, applicationId, signal);
      } catch (err) {
        if (err instanceof ApiError && err.code === 'NOT_FOUND') return null;
        throw err;
      }
    },
    [token, applicationId],
    Boolean(token),
  );

  useEffect(() => {
    if (letter.data?.body != null) setBody(letter.data.body);
  }, [letter.data?.body]);

  const pollIfGenerating = letter.data?.status === 'generating';

  useEffect(() => {
    if (!pollIfGenerating) return;
    const id = window.setInterval(() => void letter.refetch(), 2500);
    return () => window.clearInterval(id);
  }, [pollIfGenerating, letter]);

  const handleGenerate = async () => {
    if (!token) return;
    setError(null);
    try {
      await generateCoverLetter(token, applicationId);
      await letter.refetch();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Generation failed');
    }
  };

  const handleSave = async () => {
    if (!token) return;
    setSaving(true);
    setError(null);
    try {
      await updateCoverLetter(token, applicationId, body);
      await letter.refetch();
      setMessage('Letter saved.');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async () => {
    if (!token) return;
    setError(null);
    try {
      await approveCoverLetter(token, applicationId);
      await letter.refetch();
      setMessage('Letter approved.');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Approve failed');
    }
  };

  const handleDownload = async () => {
    if (!token) return;
    try {
      const blob = await downloadCoverLetterPdf(token, applicationId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cover-letter-${company.replace(/\s+/g, '-')}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'PDF download failed');
    }
  };

  if (letter.loading) return <LoadingState message="Loading cover letter…" />;
  if (letter.error) return <ErrorState message={letter.error} onRetry={letter.refetch} />;

  const status = letter.data?.status;
  const chipClass =
    status === 'failed'
      ? 'text-red-600 border-red-200'
      : status === 'approved'
        ? 'text-emerald-700 border-emerald-200'
        : status === 'generating'
          ? 'text-sky-300 border-sky-500/40'
          : 'text-amber-700 border-amber-200';

  return (
    <div className="space-y-3 border-t border-line pt-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-[14px] font-medium text-accent">
          Cover letter — {title}
        </h4>
        {status && (
          <span className={`text-[14px] font-medium px-2 py-0.5 border rounded-xl ${chipClass}`}>
            {STATUS_LABEL[status] ?? status}
          </span>
        )}
      </div>

      {message && <p className="text-xs text-emerald-700">{message}</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
      {letter.data?.error && status === 'failed' && (
        <p className="text-xs text-red-600/80">{letter.data.error}</p>
      )}

      {!letter.data ? (
        <div className="text-xs text-slate-500">
          No cover letter yet. Approve triggers generation automatically, or generate manually.
          <button
            type="button"
            onClick={() => void handleGenerate()}
            className="mt-2 block px-3 py-1.5 text-[14px] font-medium bg-accent hover:bg-accent-hover text-white rounded-full cursor-pointer"
          >
            Generate letter
          </button>
        </div>
      ) : (
        <>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={10}
            disabled={status === 'generating' || status === 'approved'}
            className="w-full bg-canvas border border-line rounded-xl px-3 py-2 text-xs leading-relaxed disabled:opacity-60"
          />
          <p className="text-[10px] text-slate-400 font-mono">
            {letter.data.word_count} words
            {letter.data.generation_count > 0 ? ` · gen ${letter.data.generation_count}` : ''}
          </p>
          <div className="flex flex-wrap gap-2">
            {(status === 'draft' || status === 'failed') && (
              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={saving || status === 'failed'}
                className="px-3 py-1.5 text-[14px] font-medium border border-line rounded-xl cursor-pointer disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save edits'}
              </button>
            )}
            {status === 'draft' && (
              <button
                type="button"
                onClick={() => void handleApprove()}
                className="px-3 py-1.5 text-[14px] font-medium bg-accent hover:bg-accent-hover text-white rounded-full cursor-pointer"
              >
                Approve letter
              </button>
            )}
            {(status === 'failed' || status === 'draft') && (
              <button
                type="button"
                onClick={() => void handleGenerate()}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-[14px] font-medium border border-line rounded-xl cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" /> Retry
              </button>
            )}
            {status === 'approved' && (
              <button
                type="button"
                onClick={() => void handleDownload()}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-[14px] font-medium border border-line rounded-xl cursor-pointer"
              >
                <Download className="w-3 h-3" /> Download PDF
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
