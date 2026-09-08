import { useState } from 'react';
import { Copy, Mic } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAsync } from '../hooks/useAsync';
import { generateInterviewPack, getInterviewPack } from '../api/autopilot';
import { ApiError } from '../api/client';
import type { InterviewPackResponse } from '../types';
import { ErrorState, LoadingState } from './ui/AsyncStates';

interface InterviewPackPanelProps {
  applicationId: string;
}

export default function InterviewPackPanel({ applicationId }: InterviewPackPanelProps) {
  const { token } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [local, setLocal] = useState<InterviewPackResponse | null>(null);

  const pack = useAsync(
    async (signal) => {
      if (!token) return null;
      try {
        return await getInterviewPack(token, applicationId, signal);
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
      const result = await generateInterviewPack(token, applicationId);
      setLocal(result);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Generation failed');
    } finally {
      setBusy(false);
    }
  };

  if (pack.loading && !data) return <LoadingState />;
  if (pack.error) return <ErrorState message={pack.error} onRetry={pack.refetch} />;

  return (
    <div className="border border-line bg-surface p-4 space-y-3">
      <h3 className="section-label flex items-center gap-2">
        <Mic className="w-4 h-4" /> Interview Pack
      </h3>
      <button
        type="button"
        disabled={busy}
        onClick={() => void handleGenerate()}
        className="section-label px-3 py-2 border border-accent/30 text-accent bg-accent-soft disabled:opacity-50"
      >
        {busy ? 'Generating…' : data ? 'Refresh interview pack' : 'Generate interview pack'}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
      {data && (
        <div className="space-y-3 text-xs">
          {data.themes.length > 0 && (
            <p className="text-slate-500">Themes: {data.themes.join(', ')}</p>
          )}
          <ul className="space-y-2">
            {data.mock_questions.map((q) => (
              <li key={q.question} className="border border-line bg-soft p-2">
                <p className="text-ink">{q.question}</p>
                {q.tip && <p className="text-slate-400 mt-1">{q.tip}</p>}
              </li>
            ))}
          </ul>
          {data.thank_you_note && (
            <div className="bg-soft border border-line p-2">
              <div className="flex justify-between text-[13px] font-medium text-accent mb-1">
                <span>Thank-you note</span>
                <button
                  type="button"
                  onClick={() => void navigator.clipboard.writeText(data.thank_you_note || '')}
                  className="inline-flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" /> Copy
                </button>
              </div>
              <p className="text-ink whitespace-pre-wrap">{data.thank_you_note}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
