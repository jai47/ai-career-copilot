import { useEffect, useState } from 'react';
import { Copy, Sparkles, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getFollowUpDraft, personaliseFollowUpDraft, updateApplication } from '../api/applications';
import { ApiError } from '../api/client';

interface FollowUpDrawerProps {
  applicationId: string | null;
  company?: string;
  title?: string;
  onClose: () => void;
  onMarkedFollowedUp?: () => void;
}

export default function FollowUpDrawer({
  applicationId,
  company,
  title,
  onClose,
  onMarkedFollowedUp,
}: FollowUpDrawerProps) {
  const { token } = useAuth();
  const [body, setBody] = useState('');
  const [days, setDays] = useState(0);
  const [personalised, setPersonalised] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!token || !applicationId) return;
    setLoading(true);
    setError(null);
    getFollowUpDraft(token, applicationId)
      .then((data) => {
        setBody(data.body);
        setDays(data.days_since_applied);
        setPersonalised(data.personalised);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load draft'))
      .finally(() => setLoading(false));
  }, [token, applicationId]);

  if (!applicationId) return null;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(body);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePersonalise = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await personaliseFollowUpDraft(token, applicationId);
      setBody(data.body);
      setPersonalised(data.personalised);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Personalisation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkFollowedUp = async () => {
    if (!token) return;
    try {
      await updateApplication(token, applicationId, {
        followed_up_at: new Date().toISOString(),
      });
      onMarkedFollowedUp?.();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Update failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button type="button" className="flex-1 bg-slate-900/20 backdrop-blur-[1px]" onClick={onClose} aria-label="Close" />
      <div className="w-full max-w-md bg-surface border-l border-line h-full overflow-y-auto p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold tracking-[-0.02em] uppercase tracking-widest text-accent">
              Follow-up draft
            </h3>
            {(company || title) && (
              <p className="text-xs text-muted mt-1">
                {company} — {title}
              </p>
            )}
            {days > 0 && (
              <p className="text-[10px] text-amber-700 mt-0.5">{days} days since applied</p>
            )}
          </div>
          <button type="button" onClick={onClose} className="text-muted hover:text-ink">
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && <p className="text-xs text-red-600 mb-3">{error}</p>}

        {loading && !body ? (
          <p className="text-xs text-muted">Loading draft…</p>
        ) : (
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={14}
            className="w-full bg-surface border border-line rounded-xl p-3 text-xs text-slate-600 font-mono resize-y"
          />
        )}

        <div className="flex flex-wrap gap-2 mt-4">
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[14px] font-medium border border-line rounded-xl hover:border-accent/50"
          >
            <Copy className="w-3 h-3" />
            {copied ? 'Copied' : 'Copy'}
          </button>
          {!personalised && (
            <button
              type="button"
              onClick={handlePersonalise}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[14px] font-medium border border-accent/40 text-accent rounded-xl hover:bg-accent/10 disabled:opacity-50"
            >
              <Sparkles className="w-3 h-3" />
              Personalise with AI
            </button>
          )}
          <button
            type="button"
            onClick={handleMarkFollowedUp}
            className="px-3 py-1.5 text-[14px] font-medium bg-accent/20 border border-accent/50 text-accent rounded-xl"
          >
            Mark followed up
          </button>
        </div>
      </div>
    </div>
  );
}
