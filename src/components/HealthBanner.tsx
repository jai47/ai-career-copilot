import { useEffect, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAsync } from '../hooks/useAsync';
import { getPipelineRuns } from '../api/pipeline';

export default function HealthBanner() {
  const { token } = useAuth();
  const today = new Date().toISOString().slice(0, 10);

  const { data } = useAsync(
    (signal) => {
      if (!token) return Promise.resolve(null);
      return getPipelineRuns(token, signal).then((r) => r.runs[0] ?? null);
    },
    [token],
    Boolean(token),
  );

  const [dismissed, setDismissed] = useState(false);
  useEffect(() => setDismissed(false), [data?.id]);

  if (!data || dismissed) return null;

  let message: string | null = null;
  let tone: 'warn' | 'error' = 'warn';

  if (data.status === 'failed') {
    message = `Last pipeline run failed${data.error_message ? `: ${data.error_message}` : ''}`;
    tone = 'error';
  } else if (data.status === 'partial') {
    message = 'Last pipeline run completed with partial errors — check Pipeline.';
  } else if (data.run_date !== today) {
    message = 'Pipeline has not run today. Refresh opportunities from Pipeline.';
  }

  if (!message) return null;

  return (
    <div
      className={`mb-8 flex items-start gap-3 px-4 py-3.5 rounded-[14px] border text-[14px] tracking-[-0.01em] ${
        tone === 'error'
          ? 'bg-[#fff2f2] border-[#f5c2c2] text-[#b00020]'
          : 'bg-[#fff9eb] border-[#f0d78c] text-[#8a6d00]'
      }`}
    >
      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" strokeWidth={1.75} />
      <p className="flex-1 leading-snug">{message}</p>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="p-1 rounded-full hover:bg-black/5 cursor-pointer opacity-70 hover:opacity-100"
        aria-label="Dismiss"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
