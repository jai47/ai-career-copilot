import { useState } from 'react';
import { ExternalLink, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { findNetworkSuggestions } from '../api/linkedin';
import { ApiError } from '../api/client';
import type { FindNetworkResponse } from '../types';

interface FindNetworkPanelProps {
  defaultCompany?: string;
  defaultJobTitle?: string;
  applicationId?: string;
}

export default function FindNetworkPanel({
  defaultCompany = '',
  defaultJobTitle = '',
  applicationId,
}: FindNetworkPanelProps) {
  const { token } = useAuth();
  const [company, setCompany] = useState(defaultCompany);
  const [jobTitle, setJobTitle] = useState(defaultJobTitle);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<FindNetworkResponse | null>(null);

  const handleSuggest = async () => {
    if (!token) return;
    const companyValue = company.trim() || defaultCompany.trim();
    if (!companyValue) {
      setError('Enter a company name');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const data = await findNetworkSuggestions(token, {
        company: companyValue,
        job_title: jobTitle.trim() || defaultJobTitle || null,
        application_id: applicationId || null,
      });
      setResult(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not generate search ideas');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3 border border-line bg-surface p-4">
      <div className="flex items-center gap-2 text-accent">
        <Search className="w-4 h-4" />
        <h3 className="section-label">Find Network</h3>
      </div>
      <p className="text-[11px] text-slate-400">
        We suggest LinkedIn people-search queries. Open them while logged into LinkedIn, then import
        people with the Chrome extension (or add URLs manually).
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <input
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          placeholder="Company"
          className="bg-soft border border-line px-3 py-2 text-sm text-ink"
        />
        <input
          value={jobTitle}
          onChange={(e) => setJobTitle(e.target.value)}
          placeholder="Target role"
          className="bg-soft border border-line px-3 py-2 text-sm text-ink"
        />
      </div>
      <button
        type="button"
        onClick={handleSuggest}
        disabled={busy}
        className="section-label px-3 py-2 border border-accent/30 text-accent bg-accent-soft disabled:opacity-50"
      >
        {busy ? 'Generating…' : 'Suggest LinkedIn searches'}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
      {result && (
        <div className="space-y-2">
          <p className="text-xs text-slate-700">{result.strategy_summary}</p>
          <ul className="space-y-2">
            {result.suggestions.map((s) => (
              <li
                key={`${s.role_tag}-${s.title_query}`}
                className="text-xs border border-line bg-soft px-3 py-2 flex flex-col gap-1"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-accent uppercase tracking-wider text-[10px]">
                    {s.role_tag.replace('_', ' ')} · P{s.priority}
                  </span>
                  <a
                    href={s.linkedin_search_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-slate-600 hover:text-ink"
                  >
                    Open search <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <span className="text-ink">{s.title_query}</span>
                <span className="text-slate-400">{s.why}</span>
              </li>
            ))}
          </ul>
          <p className="text-[10px] text-slate-400">{result.tip}</p>
        </div>
      )}
    </div>
  );
}
