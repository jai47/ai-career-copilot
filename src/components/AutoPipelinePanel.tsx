import { useState } from 'react';
import { ClipboardPaste } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { runAutoPipeline } from '../api/autopilot';
import { ApiError } from '../api/client';
import type { AutoPipelineResponse } from '../types';

export default function AutoPipelinePanel() {
  const { token } = useAuth();
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');
  const [company, setCompany] = useState('');
  const [title, setTitle] = useState('');
  const [approve, setApprove] = useState(false);
  const [track, setTrack] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AutoPipelineResponse | null>(null);

  const handleRun = async () => {
    if (!token || description.trim().length < 40) {
      setError('Paste at least 40 characters of the job description.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const data = await runAutoPipeline(token, {
        description: description.trim(),
        url: url.trim() || null,
        company: company.trim() || null,
        title: title.trim() || null,
        approve,
        track: track && !approve,
      });
      setResult(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Auto-pipeline failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="sophisticated-card p-6 space-y-4">
      <div className="flex items-center gap-2">
        <ClipboardPaste className="w-4 h-4 text-accent" strokeWidth={1.75} />
        <h3 className="text-[17px] font-semibold tracking-[-0.02em]">Paste a job</h3>
      </div>
      <p className="text-[14px] text-muted">
        Score any JD outside the nightly boards. Approve to tailor a resume — you still apply
        yourself.
      </p>
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={7}
        placeholder="Paste the full job description…"
        className="w-full text-[14px] px-4 py-3 rounded-[12px] border border-line bg-soft text-ink"
      />
      <div className="grid sm:grid-cols-3 gap-3">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title (optional)"
          className="text-[14px] px-3 py-2.5 rounded-[12px] border border-line bg-surface"
        />
        <input
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          placeholder="Company (optional)"
          className="text-[14px] px-3 py-2.5 rounded-[12px] border border-line bg-surface"
        />
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="URL (optional)"
          className="text-[14px] px-3 py-2.5 rounded-[12px] border border-line bg-surface"
        />
      </div>
      <div className="flex flex-wrap gap-4 text-[14px] text-ink">
        <label className="inline-flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={track}
            onChange={(e) => setTrack(e.target.checked)}
            disabled={approve}
          />
          Add to tracker
        </label>
        <label className="inline-flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={approve}
            onChange={(e) => {
              setApprove(e.target.checked);
              if (e.target.checked) setTrack(true);
            }}
          />
          Approve + tailor resume
        </label>
      </div>
      {error && (
        <p className="text-[14px] text-[#b00020] bg-[#fff2f2] border border-[#f5c2c2] px-3 py-2 rounded-[12px]">
          {error}
        </p>
      )}
      <button
        type="button"
        disabled={busy}
        onClick={() => void handleRun()}
        className="px-5 py-2.5 text-[14px] font-medium rounded-full bg-accent hover:bg-accent-hover text-white disabled:opacity-50"
      >
        {busy ? 'Scoring…' : 'Run auto-pipeline'}
      </button>
      {result && (
        <div className="border-t border-line pt-4 space-y-2 text-[14px]">
          <p className="text-ink font-medium">
            {result.title} @ {result.company} — score {result.overall_score} ({result.classification})
          </p>
          <p className="text-muted">{result.fit_reasoning}</p>
          <p className="text-muted">
            Visa: {result.visa_status}
            {result.application_id ? ` · Application ${result.application_id.slice(0, 8)}…` : ''}
            {result.tailored ? ' · Resume tailored' : ''}
          </p>
        </div>
      )}
    </section>
  );
}
