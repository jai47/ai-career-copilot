import { useState } from 'react';
import { Copy, Puzzle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAsync } from '../hooks/useAsync';
import {
  analyzeLinkedInProfile,
  getLinkedInProfileAnalysis,
} from '../api/linkedin';
import { API_URL, ApiError } from '../api/client';
import type { LinkedInProfileAnalysisResponse } from '../types';
import { EmptyState, ErrorState, LoadingState } from './ui/AsyncStates';
import FindNetworkPanel from './FindNetworkPanel';

function AnalysisView({ data }: { data: LinkedInProfileAnalysisResponse }) {
  return (
    <div className="space-y-4">
      <div className="flex items-end gap-4">
        <div>
          <p className="text-[13px] font-medium text-slate-400">Overall</p>
          <p className="text-3xl text-accent font-semibold tracking-[-0.02em]">{data.overall_score}</p>
        </div>
        <p className="text-sm text-slate-700 pb-1">{data.summary}</p>
      </div>
      {data.quick_wins.length > 0 && (
        <div>
          <h3 className="section-label mb-2">Quick wins</h3>
          <ul className="list-disc list-inside text-xs text-slate-600 space-y-1">
            {data.quick_wins.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </div>
      )}
      {(data.headline_suggestion || data.about_suggestion) && (
        <div className="grid gap-3">
          {data.headline_suggestion && (
            <div className="border border-line bg-soft p-3">
              <p className="text-[14px] font-medium text-slate-400 mb-1">
                Suggested headline
              </p>
              <p className="text-sm text-ink whitespace-pre-wrap">{data.headline_suggestion}</p>
            </div>
          )}
          {data.about_suggestion && (
            <div className="border border-line bg-soft p-3">
              <p className="text-[14px] font-medium text-slate-400 mb-1">
                Suggested About
              </p>
              <p className="text-sm text-ink whitespace-pre-wrap">{data.about_suggestion}</p>
            </div>
          )}
        </div>
      )}
      <div className="space-y-2">
        {data.sections.map((section) => (
          <div key={section.section} className="border border-line bg-surface px-3 py-2">
            <div className="flex justify-between text-xs">
              <span className="text-ink uppercase tracking-wider">{section.section}</span>
              <span className="text-accent">
                {section.score} · {section.status}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">{section.feedback}</p>
            {section.suggested_rewrite && (
              <p className="text-xs text-slate-700 mt-2 whitespace-pre-wrap border-t border-line pt-2">
                {section.suggested_rewrite}
              </p>
            )}
          </div>
        ))}
      </div>
      <p className="text-[10px] text-slate-400">
        Source: {data.source}
        {data.analyzed_at ? ` · ${new Date(data.analyzed_at).toLocaleString()}` : ''}
      </p>
    </div>
  );
}

export default function LinkedInCoach() {
  const { token } = useAuth();
  const [profileText, setProfileText] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<LinkedInProfileAnalysisResponse | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const saved = useAsync(
    async (signal) => {
      if (!token) return null;
      try {
        return await getLinkedInProfileAnalysis(token, signal);
      } catch (err) {
        if (err instanceof ApiError && err.statusCode === 404) return null;
        throw err;
      }
    },
    [token],
    Boolean(token),
  );

  const display = analysis ?? saved.data;

  const copyValue = async (label: string, value: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleAnalyze = async () => {
    if (!token) return;
    if (profileText.trim().length < 80) {
      setError('Paste at least ~80 characters of profile text, or use the Chrome extension.');
      return;
    }
    setAnalyzing(true);
    setError(null);
    try {
      const result = await analyzeLinkedInProfile(token, {
        profile_text: profileText.trim(),
        source: 'pasted_profile',
      });
      setAnalysis(result);
      await saved.refetch();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  if (saved.loading && !saved.data && !analysis) return <LoadingState />;
  if (saved.error) return <ErrorState message={saved.error} onRetry={saved.refetch} />;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="page-title">LinkedIn.</h1>
        <p className="page-subtitle">
          Profile tips and networking — without storing your LinkedIn login.
        </p>
      </div>

      <section className="sophisticated-card p-6 space-y-3">
        <div className="flex items-center gap-2 text-accent">
          <Puzzle className="w-4 h-4" strokeWidth={1.75} />
          <h3 className="section-label">Chrome extension</h3>
        </div>
        <ol className="text-[14px] text-muted list-decimal list-inside space-y-1.5">
          <li>
            Load unpacked extension from <code className="text-accent">chrome-extension/</code> in
            this repo
          </li>
          <li>Paste API URL + bearer token below into the extension popup</li>
          <li>
            On LinkedIn: analyze your profile, or import people from search / company People pages
          </li>
        </ol>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => copyValue('api', API_URL)}
            className="text-[14px] font-medium px-3 py-2 border border-line text-slate-600 inline-flex items-center gap-1"
          >
            <Copy className="w-3 h-3" /> Copy API URL
          </button>
          <button
            type="button"
            onClick={() => token && copyValue('token', token)}
            className="text-[14px] font-medium px-3 py-2 border border-line text-slate-600 inline-flex items-center gap-1"
          >
            <Copy className="w-3 h-3" /> Copy bearer token
          </button>
          {copied && (
            <span className="text-[10px] text-emerald-600 self-center">Copied {copied}</span>
          )}
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="section-label">Profile optimizer</h3>
        <textarea
          value={profileText}
          onChange={(e) => setProfileText(e.target.value)}
          rows={8}
          placeholder="Paste LinkedIn profile text here (headline, about, experience…), or use the extension on your profile page."
          className="w-full bg-soft border border-line px-3 py-2 text-sm text-ink"
        />
        <button
          type="button"
          onClick={handleAnalyze}
          disabled={analyzing}
          className="section-label px-3 py-2 border border-accent/30 text-accent bg-accent-soft disabled:opacity-50"
        >
          {analyzing ? 'Analyzing…' : 'Analyze pasted profile'}
        </button>
        {error && <p className="text-xs text-red-600">{error}</p>}
        {display ? (
          <AnalysisView data={display} />
        ) : (
          <EmptyState message="No analysis yet — paste a profile or use the Chrome extension." />
        )}
      </section>

      <FindNetworkPanel />
    </div>
  );
}
