import { useState } from 'react';
import { Download, RefreshCw, RotateCcw, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';
import { useAsync } from '../hooks/useAsync';
import LatexResumeStudio from './LatexResumeStudio';
import {
  deleteAllResumeVersions,
  deleteResumeVersion,
  downloadResumePdf,
  listResumeVersions,
  regenerateResumeForApplication,
} from '../api/resumes';
import { getLlmStatus } from '../api/users';
import { ApiError } from '../api/client';
import { EmptyState, ErrorState, LoadingState } from '../components/ui/AsyncStates';
import type { ResumeVersionItem } from '../types';

export default function ResumeVersions() {
  const { token } = useAuth();
  const { profile } = useProfile();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [latexOverrides, setLatexOverrides] = useState<Record<string, string>>({});
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);

  const llm = useAsync((signal) => getLlmStatus(signal), [], true);

  const versions = useAsync(
    (signal) => {
      if (!token) return Promise.reject(new Error('Not authenticated'));
      return listResumeVersions(token, signal).then((r) => r.versions);
    },
    [token],
    Boolean(token),
  );

  const selected: ResumeVersionItem | null =
    versions.data?.find((v) => v.id === selectedId) ?? versions.data?.[0] ?? null;

  const handleDownloadPdf = async () => {
    if (!token || !selected) return;
    setPdfLoading(true);
    setPdfError(null);
    try {
      const blob = await downloadResumePdf(token, selected.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `resume-${selected.company.replace(/\s+/g, '-')}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setPdfError(err instanceof ApiError ? err.message : 'PDF download failed');
    } finally {
      setPdfLoading(false);
    }
  };

  const handleResetView = () => {
    setSelectedId(versions.data?.[0]?.id ?? null);
    setPdfError(null);
    setActionError(null);
  };

  const handleRegenerate = async () => {
    if (!token || !selected?.application_id) return;
    setRegenerating(true);
    setActionError(null);
    try {
      const updated = await regenerateResumeForApplication(token, selected.application_id);
      await versions.refetch();
      setSelectedId(updated.id);
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Regenerate failed');
    } finally {
      setRegenerating(false);
    }
  };

  const handleDelete = async () => {
    if (!token || !selected) return;
    if (!window.confirm(`Delete tailored resume for ${selected.company}?`)) return;
    setDeleting(true);
    setActionError(null);
    try {
      await deleteResumeVersion(token, selected.id);
      await versions.refetch();
      setSelectedId(null);
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteAll = async () => {
    if (!token || !versions.data?.length) return;
    const count = versions.data.length;
    if (
      !window.confirm(
        `Delete all ${count} tailored resume${count === 1 ? '' : 's'}? Applications will be kept but lose their linked resume.`,
      )
    ) {
      return;
    }
    setDeletingAll(true);
    setActionError(null);
    try {
      await deleteAllResumeVersions(token);
      await versions.refetch();
      setSelectedId(null);
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Delete all failed');
    } finally {
      setDeletingAll(false);
    }
  };

  if (versions.loading) return <LoadingState message="Loading resume versions…" />;
  if (versions.error) return <ErrorState message={versions.error} onRetry={versions.refetch} />;

  if (!versions.data?.length) {
    return (
      <div className="space-y-4">
        {llm.data && !llm.data.providers.some((provider) => provider.configured) && (
          <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-4 py-3 rounded-xl">
            No LLM configured — approve will use local formatting fallback. Configure keys in
            Settings → API Keys (read-only status).
          </div>
        )}
        <EmptyState message="No tailored resumes yet. Approve opportunities from Daily Digest or Opportunities to generate versions." />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="page-title">Resumes.</h1>
        <p className="page-subtitle">Tailored versions for roles you approved.</p>
      </div>

      {llm.data && !llm.data.providers.some((provider) => provider.configured) && (
        <div className="text-[14px] text-[#8a6d00] bg-[#fff9eb] border border-[#f0d78c] px-4 py-3 rounded-[12px]">
          LLM not fully configured — some versions may use local formatting.
        </div>
      )}

      {actionError && (
        <div className="text-[14px] text-[#b00020] bg-[#fff2f2] border border-[#f5c2c2] px-4 py-3 rounded-[12px]">
          {actionError}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
        {versions.data.map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => setSelectedId(v.id)}
            className={`px-4 py-2 text-[14px] font-medium rounded-full border cursor-pointer transition-colors ${
              (selected?.id ?? versions.data![0].id) === v.id
                ? 'border-ink bg-ink text-white'
                : 'border-line hover:bg-soft text-ink'
            }`}
          >
            {v.job_title} @ {v.company}
          </button>
        ))}
        </div>
        <button
          type="button"
          disabled={deletingAll || deleting}
          onClick={() => void handleDeleteAll()}
          className="inline-flex items-center gap-2 px-3 py-2 border border-red-200 text-red-600 text-[14px] font-medium rounded-xl cursor-pointer disabled:opacity-50 shrink-0"
        >
          <Trash2 className="w-3.5 h-3.5" />
          {deletingAll ? 'Deleting all…' : 'Delete all'}
        </button>
      </div>

      {selected && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2 text-[14px] font-medium">
            {selected.ai_tailored && (
              <span className="px-2 py-0.5 bg-emerald-950/30 border border-emerald-200 text-emerald-200 rounded-xl">
                AI tailored
              </span>
            )}
            {selected.ai_latex && (
              <span className="px-2 py-0.5 bg-blue-950/30 border border-blue-500/40 text-blue-200 rounded-xl">
                AI LaTeX
              </span>
            )}
            <span className="px-2 py-0.5 bg-soft border border-line rounded-xl">
              PDF: {selected.pdf_engine}
            </span>
            {selected.ats_score_before != null && selected.ats_score_after != null && (
              <span className="px-2 py-0.5 bg-soft border border-line rounded-xl">
                ATS {selected.ats_score_before} → {selected.ats_score_after}
              </span>
            )}
          </div>

          {(selected.keywords_added.length > 0 || selected.skill_gaps.length > 0) && (
            <div className="grid sm:grid-cols-2 gap-4 text-xs">
              {selected.keywords_added.length > 0 && (
                <div>
                  <p className="text-[14px] font-medium text-accent mb-2">Keywords added</p>
                  <div className="flex flex-wrap gap-1">
                    {selected.keywords_added.map((k) => (
                      <span key={k} className="px-2 py-0.5 bg-soft border border-line rounded-xl">
                        {k}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {selected.skill_gaps.length > 0 && (
                <div>
                  <p className="text-[14px] font-medium text-amber-700 mb-2">Skill gaps</p>
                  <div className="flex flex-wrap gap-1">
                    {selected.skill_gaps.map((k) => (
                      <span
                        key={k}
                        className="px-2 py-0.5 bg-amber-50 border border-amber-500/30 rounded-xl text-amber-800"
                      >
                        {k}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {token && (
            <LatexResumeStudio
              key={selected.id}
              token={token}
              versionId={selected.id}
              initialLatex={latexOverrides[selected.id] ?? selected.latex_source}
              onSaved={(latex) =>
                setLatexOverrides((prev) => ({ ...prev, [selected.id]: latex }))
              }
            />
          )}

          {pdfError && (
            <div className="text-xs text-red-600">{pdfError}</div>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={pdfLoading || !profile?.has_active_resume}
              onClick={() => void handleDownloadPdf()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent-hover text-white text-[14px] font-medium rounded-full px-5 py-2.5 cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              {pdfLoading ? 'Generating PDF…' : 'Download PDF'}
            </button>
            {selected.application_id && (
              <button
                type="button"
                disabled={regenerating || !profile?.has_active_resume}
                onClick={() => void handleRegenerate()}
                className="inline-flex items-center gap-2 px-4 py-2 border border-accent/50 text-accent text-[14px] font-medium rounded-xl cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${regenerating ? 'animate-spin' : ''}`} />
                {regenerating ? 'Regenerating…' : 'Regenerate'}
              </button>
            )}
            <button
              type="button"
              disabled={deleting}
              onClick={() => void handleDelete()}
              className="inline-flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 text-[14px] font-medium rounded-xl cursor-pointer disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
            <button
              type="button"
              onClick={handleResetView}
              className="inline-flex items-center gap-2 px-4 py-2 border border-line text-slate-600 text-[14px] font-medium rounded-xl cursor-pointer hover:border-accent/40"
            >
              <RotateCcw className="w-4 h-4" />
              Reset view
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
