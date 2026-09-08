import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useProfile } from '../../context/ProfileContext';
import { updateProfile } from '../../api/users';
import { ApiError } from '../../api/client';
import { COUNTRY_OPTIONS, SALARY_CURRENCIES, TARGET_ROLES } from '../../constants';
import FilterChipGroup from '../ui/FilterChipGroup';

export default function ProfileTab() {
  const { token } = useAuth();
  const { profile, refetchProfile } = useProfile();

  const [nationality, setNationality] = useState('');
  const [preferredCountries, setPreferredCountries] = useState<string[]>([]);
  const [preferredRoles, setPreferredRoles] = useState<string[]>([]);
  const [prefersRemote, setPrefersRemote] = useState(false);
  const [salaryMin, setSalaryMin] = useState('');
  const [salaryMax, setSalaryMax] = useState('');
  const [salaryCurrency, setSalaryCurrency] = useState('USD');
  const [yearsExperience, setYearsExperience] = useState('');
  const [scoreThreshold, setScoreThreshold] = useState(40);
  const [notifyDigest, setNotifyDigest] = useState(true);
  const [notifyFollowup, setNotifyFollowup] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    setNationality(profile.nationality ?? '');
    setPreferredCountries(profile.preferred_countries ?? []);
    setPreferredRoles(profile.preferred_roles ?? []);
    setPrefersRemote(profile.prefers_remote);
    setSalaryMin(profile.salary_range_min != null ? String(profile.salary_range_min) : '');
    setSalaryMax(profile.salary_range_max != null ? String(profile.salary_range_max) : '');
    setSalaryCurrency(profile.salary_currency ?? 'USD');
    setYearsExperience(profile.years_experience != null ? String(profile.years_experience) : '');
    setScoreThreshold(profile.score_warning_threshold ?? 40);
    setNotifyDigest(profile.notify_digest_email ?? true);
    setNotifyFollowup(profile.notify_followup_email ?? true);
  }, [profile]);

  const countryOptions = Object.entries(COUNTRY_OPTIONS).map(([value, label]) => ({ value, label }));
  const roleOptions = TARGET_ROLES.map((role) => ({ value: role, label: role }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      await updateProfile(token, {
        nationality: nationality || null,
        preferred_countries: preferredCountries,
        preferred_roles: preferredRoles,
        prefers_remote: prefersRemote,
        salary_range_min: salaryMin ? Number(salaryMin) : null,
        salary_range_max: salaryMax ? Number(salaryMax) : null,
        salary_currency: salaryCurrency,
        years_experience: yearsExperience ? Number(yearsExperience) : null,
        score_warning_threshold: scoreThreshold,
        notify_digest_email: notifyDigest,
        notify_followup_email: notifyFollowup,
      });
      await refetchProfile();
      setMessage('Preferences saved.');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleThresholdChange = async (value: number) => {
    setScoreThreshold(value);
    if (!token) return;
    try {
      await updateProfile(token, { score_warning_threshold: value });
      await refetchProfile();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save threshold');
    }
  };

  if (!profile) return <p className="text-xs text-slate-400">Loading profile…</p>;

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-2xl">
      <div className="text-xs text-slate-500">
        Signed in as <span className="text-ink">{profile.name}</span> ({profile.email})
      </div>

      {message && (
        <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-xl">
          {message}
        </div>
      )}
      {error && (
        <div className="text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-xl">
          {error}
        </div>
      )}

      <div>
        <label className="text-[14px] font-medium text-slate-400 block mb-1">
          Nationality (ISO-2)
        </label>
        <select
          value={nationality}
          onChange={(e) => setNationality(e.target.value)}
          className="w-full bg-canvas border border-line rounded-xl px-3 py-2 text-xs"
        >
          <option value="">—</option>
          {Object.entries(COUNTRY_OPTIONS).map(([code, name]) => (
            <option key={code} value={code}>
              {code} — {name}
            </option>
          ))}
        </select>
      </div>

      <FilterChipGroup
        label="Preferred countries"
        options={countryOptions}
        selected={preferredCountries}
        onChange={setPreferredCountries}
      />

      <FilterChipGroup
        label="Preferred roles"
        options={roleOptions}
        selected={preferredRoles}
        onChange={setPreferredRoles}
      />

      <label className="flex items-center gap-2 text-xs cursor-pointer">
        <input
          type="checkbox"
          checked={prefersRemote}
          onChange={(e) => setPrefersRemote(e.target.checked)}
          className="accent-accent"
        />
        Prefer remote roles
      </label>

      <div>
        <div className="flex justify-between items-baseline mb-2">
          <p className="text-[14px] font-medium text-slate-400">
            Low-match warning threshold
          </p>
          <span className="text-xs font-mono text-accent">{scoreThreshold}</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={scoreThreshold}
          onChange={(e) => void handleThresholdChange(Number(e.target.value))}
          className="w-full max-w-md accent-accent"
        />
        <p className="text-[10px] text-slate-400 mt-1">
          Opportunities below this score show an amber &quot;Low match — consider skipping&quot;
          warning. Grade bands: A ≥85 · B ≥70 · C ≥55 · D ≥40 · F &lt;40.
        </p>
      </div>

      <div className="space-y-2">
        <p className="text-[14px] font-medium text-slate-400">Email notifications</p>
        <label className="flex items-center gap-2 text-xs cursor-pointer">
          <input
            type="checkbox"
            checked={notifyDigest}
            onChange={(e) => setNotifyDigest(e.target.checked)}
            className="accent-accent"
          />
          Daily digest emails
        </label>
        <label className="flex items-center gap-2 text-xs cursor-pointer">
          <input
            type="checkbox"
            checked={notifyFollowup}
            onChange={(e) => setNotifyFollowup(e.target.checked)}
            className="accent-accent"
          />
          Follow-up reminder emails
        </label>
        <p className="text-[10px] text-slate-400">In-app notifications are always enabled.</p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <div>
          <label className="text-[14px] font-medium text-slate-400 block mb-1">
            Salary min
          </label>
          <input
            type="number"
            value={salaryMin}
            onChange={(e) => setSalaryMin(e.target.value)}
            className="w-full bg-canvas border border-line rounded-xl px-3 py-2 text-xs"
          />
        </div>
        <div>
          <label className="text-[14px] font-medium text-slate-400 block mb-1">
            Salary max
          </label>
          <input
            type="number"
            value={salaryMax}
            onChange={(e) => setSalaryMax(e.target.value)}
            className="w-full bg-canvas border border-line rounded-xl px-3 py-2 text-xs"
          />
        </div>
        <div>
          <label className="text-[14px] font-medium text-slate-400 block mb-1">
            Currency
          </label>
          <select
            value={salaryCurrency}
            onChange={(e) => setSalaryCurrency(e.target.value)}
            className="w-full bg-canvas border border-line rounded-xl px-3 py-2 text-xs"
          >
            {SALARY_CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="text-[14px] font-medium text-slate-400 block mb-1">
          Years of experience
        </label>
        <input
          type="number"
          min={0}
          value={yearsExperience}
          onChange={(e) => setYearsExperience(e.target.value)}
          className="w-full max-w-xs bg-canvas border border-line rounded-xl px-3 py-2 text-xs"
        />
      </div>

      {profile.parsed_skills.length > 0 && (
        <div>
          <p className="text-[14px] font-medium text-slate-400 mb-2">
            Parsed skills (read-only — from resume)
          </p>
          <div className="flex flex-wrap gap-1">
            {profile.parsed_skills.map((s) => (
              <span key={s} className="px-2 py-0.5 text-[10px] bg-soft border border-line rounded-xl">
                {s}
              </span>
            ))}
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={saving}
        className="px-5 py-2 bg-accent hover:bg-accent-hover text-white text-[14px] font-medium rounded-full px-5 py-2.5 cursor-pointer disabled:opacity-50"
      >
        {saving ? 'Saving…' : 'Save preferences'}
      </button>
    </form>
  );
}
