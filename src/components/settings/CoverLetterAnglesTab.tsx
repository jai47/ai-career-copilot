import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useProfile } from '../../context/ProfileContext';
import { updateProfile } from '../../api/users';
import { ApiError } from '../../api/client';

const ANGLE_FIELDS = [
  { key: 'why_company', label: 'Why this company' },
  { key: 'problem_i_solve', label: 'Problem I solve' },
  { key: 'my_approach', label: 'My approach' },
  { key: 'tone', label: 'Tone' },
] as const;

export default function CoverLetterAnglesTab() {
  const { token } = useAuth();
  const { profile, refetchProfile } = useProfile();
  const [angles, setAngles] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.cover_letter_angles) setAngles(profile.cover_letter_angles);
  }, [profile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      await updateProfile(token, { cover_letter_angles: angles });
      await refetchProfile();
      setMessage('Angle prompts saved.');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (!profile) return <p className="text-xs text-slate-400">Loading…</p>;

  return (
    <form onSubmit={handleSave} className="space-y-4 max-w-2xl">
      <p className="text-xs text-slate-500">
        Default prompts used when generating cover letters on approve. One LLM call per generation.
      </p>
      {message && <p className="text-xs text-emerald-700">{message}</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
      {ANGLE_FIELDS.map(({ key, label }) => (
        <div key={key}>
          <label className="text-[14px] font-medium text-slate-400 block mb-1">
            {label}
          </label>
          <textarea
            value={angles[key] ?? ''}
            onChange={(e) => setAngles((a) => ({ ...a, [key]: e.target.value }))}
            rows={3}
            className="w-full bg-canvas border border-line rounded-xl px-3 py-2 text-xs"
          />
        </div>
      ))}
      <button
        type="submit"
        disabled={saving}
        className="px-5 py-2 bg-accent hover:bg-accent-hover text-white text-[14px] font-medium rounded-full px-5 py-2.5 cursor-pointer disabled:opacity-50"
      >
        {saving ? 'Saving…' : 'Save angle prompts'}
      </button>
    </form>
  );
}
