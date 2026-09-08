import { useState } from 'react';
import { Building2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { researchCompany } from '../api/autopilot';
import { ApiError } from '../api/client';
import type { CompanyResearchResponse } from '../types';

interface CompanyResearchPanelProps {
  company?: string;
  jobTitle?: string;
  applicationId?: string;
}

export default function CompanyResearchPanel({
  company: initialCompany = '',
  jobTitle,
  applicationId,
}: CompanyResearchPanelProps) {
  const { token } = useAuth();
  const [company, setCompany] = useState(initialCompany);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<CompanyResearchResponse | null>(null);

  const handleResearch = async (force = false) => {
    if (!token) return;
    const name = (company || initialCompany).trim();
    if (!name) {
      setError('Enter a company name.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      setData(
        await researchCompany(token, {
          company: name,
          job_title: jobTitle || null,
          application_id: applicationId || null,
          force,
        }),
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Research failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="sophisticated-card p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Building2 className="w-4 h-4 text-accent" strokeWidth={1.75} />
        <h3 className="text-[17px] font-semibold tracking-[-0.02em]">Company research</h3>
      </div>
      <p className="text-[14px] text-muted">
        Deep brief before you apply. Guidance only — verify funding and leadership from primary
        sources.
      </p>
      {!applicationId && (
        <input
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          placeholder="Company name"
          className="w-full text-[14px] px-3 py-2.5 rounded-[12px] border border-line bg-surface"
        />
      )}
      {error && <p className="text-[14px] text-[#b00020]">{error}</p>}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => void handleResearch(false)}
          className="px-4 py-2 text-[14px] font-medium rounded-full bg-ink text-white disabled:opacity-50"
        >
          {busy ? 'Researching…' : 'Research'}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void handleResearch(true)}
          className="px-4 py-2 text-[14px] font-medium rounded-full border border-line disabled:opacity-50"
        >
          Refresh
        </button>
      </div>
      {data && (
        <div className="space-y-3 text-[14px]">
          <p className="text-ink leading-relaxed">{data.summary}</p>
          {data.funding_or_stage && (
            <p className="text-muted">
              <span className="font-medium text-ink">Stage: </span>
              {data.funding_or_stage}
            </p>
          )}
          {data.red_flags.length > 0 && (
            <div>
              <p className="section-label mb-1">Red flags</p>
              <ul className="list-disc list-inside text-[#8a6d00]">
                {data.red_flags.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </div>
          )}
          {data.questions_to_ask.length > 0 && (
            <div>
              <p className="section-label mb-1">Ask</p>
              <ul className="list-disc list-inside text-muted">
                {data.questions_to_ask.map((q) => (
                  <li key={q}>{q}</li>
                ))}
              </ul>
            </div>
          )}
          {data.cached && <p className="text-[12px] text-muted">Cached result</p>}
        </div>
      )}
    </section>
  );
}
