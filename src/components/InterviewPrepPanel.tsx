import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  getApplicationThemes,
  getInterviewPrep,
  retryApplicationThemes,
} from '../api/applications';
import { draftStoryWithAi } from '../api/stories';
import { ApiError } from '../api/client';
import type { InterviewPrepResponse, ThemesResponse } from '../types';

interface InterviewPrepPanelProps {
  applicationId: string;
  isInterviewing: boolean;
}

function tagLabel(tag: string) {
  return tag.replace(/_/g, ' ');
}

export default function InterviewPrepPanel({ applicationId, isInterviewing }: InterviewPrepPanelProps) {
  const { token } = useAuth();
  const [themes, setThemes] = useState<ThemesResponse | null>(null);
  const [prep, setPrep] = useState<InterviewPrepResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [drafting, setDrafting] = useState<string | null>(null);

  // Themes and prep are fetched independently so a failure in one (e.g. prep,
  // which only applies once interviewing) doesn't discard already-loaded data
  // from the other, as a combined Promise.all would.
  const refreshThemes = async () => {
    if (!token) return;
    try {
      setThemes(await getApplicationThemes(token, applicationId));
    } catch {
      setThemes({ themes: [], status: 'pending' });
    }
  };

  const refreshPrep = async () => {
    if (!token || !isInterviewing) return;
    try {
      setPrep(await getInterviewPrep(token, applicationId));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load interview prep');
    }
  };

  const refresh = () => Promise.all([refreshThemes(), refreshPrep()]);

  useEffect(() => {
    void refresh();
  }, [token, applicationId, isInterviewing]);

  const handleRetryThemes = async () => {
    if (!token) return;
    try {
      await retryApplicationThemes(token, applicationId);
      setThemes({ themes: [], status: 'pending' });
      setTimeout(() => void refresh(), 2000);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Retry failed');
    }
  };

  const handleDraft = async (tag: string) => {
    if (!token) return;
    setDrafting(tag);
    setError(null);
    try {
      await draftStoryWithAi(token, tag, applicationId);
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Draft failed');
    } finally {
      setDrafting(null);
    }
  };

  return (
    <div className="border border-line rounded-xl p-3 space-y-3">
      <h4 className="text-[14px] font-medium text-accent">
        Interview themes
      </h4>
      {themes?.status === 'pending' && (
        <p className="text-xs text-muted">Extracting themes from job description…</p>
      )}
      {themes?.status === 'failed' && (
        <div className="flex items-center gap-2">
          <p className="text-xs text-amber-700">Theme extraction failed.</p>
          <button
            type="button"
            onClick={() => void handleRetryThemes()}
            className="text-[13px] font-medium text-accent underline"
          >
            Retry
          </button>
        </div>
      )}
      {themes?.themes && themes.themes.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {themes.themes.map((t) => (
            <span
              key={t}
              className="px-2 py-0.5 text-[10px] bg-soft border border-line rounded-xl capitalize"
            >
              {tagLabel(t)}
            </span>
          ))}
        </div>
      )}

      {isInterviewing && (
        <>
          <h4 className="text-[14px] font-medium text-accent pt-2">
            Prep for this interview
          </h4>
          {prep?.stories && prep.stories.length > 0 ? (
            <ul className="space-y-2">
              {prep.stories.map((s) => (
                <li key={s.id} className="text-xs border border-line rounded-xl p-2">
                  <p className="text-slate-600 font-medium">{s.title}</p>
                  <p className="text-[10px] text-muted mt-0.5">{s.tags.map(tagLabel).join(', ')}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-muted">No ready stories match these themes yet.</p>
          )}
          {prep?.uncovered_themes && prep.uncovered_themes.length > 0 && (
            <div className="space-y-1">
              <p className="text-[10px] text-amber-700">No story yet for:</p>
              {prep.uncovered_themes.map((t) => (
                <button
                  key={t}
                  type="button"
                  disabled={drafting === t}
                  onClick={() => void handleDraft(t)}
                  className="flex items-center gap-1 text-[10px] text-accent hover:underline disabled:opacity-50"
                >
                  <Sparkles className="w-3 h-3" />
                  {drafting === t ? 'Drafting…' : `Draft story: ${tagLabel(t)}`}
                </button>
              ))}
            </div>
          )}
        </>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
