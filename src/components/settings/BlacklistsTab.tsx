import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAsync } from '../../hooks/useAsync';
import { getBlacklists, updateBlacklists } from '../../api/users';
import { ApiError } from '../../api/client';

type ListKey = 'blacklisted_companies' | 'blacklisted_roles' | 'blacklisted_locations';

export default function BlacklistsTab() {
  const { token } = useAuth();
  const [draft, setDraft] = useState({
    blacklisted_companies: [] as string[],
    blacklisted_roles: [] as string[],
    blacklisted_locations: [] as string[],
  });
  const [inputs, setInputs] = useState({ companies: '', roles: '', locations: '' });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data, loading, error: loadError, refetch } = useAsync(
    (signal) => {
      if (!token) return Promise.reject(new Error('Not authenticated'));
      return getBlacklists(token, signal);
    },
    [token],
    Boolean(token),
  );

  useEffect(() => {
    if (data) {
      setDraft({
        blacklisted_companies: data.blacklisted_companies ?? [],
        blacklisted_roles: data.blacklisted_roles ?? [],
        blacklisted_locations: data.blacklisted_locations ?? [],
      });
    }
  }, [data]);

  const addItem = (key: ListKey, inputKey: keyof typeof inputs) => {
    const value = inputs[inputKey].trim();
    if (!value) return;
    setDraft((d) => ({ ...d, [key]: [...d[key], value] }));
    setInputs((i) => ({ ...i, [inputKey]: '' }));
  };

  const removeItem = (key: ListKey, index: number) => {
    setDraft((d) => ({ ...d, [key]: d[key].filter((_, i) => i !== index) }));
  };

  const handleSave = async () => {
    if (!token) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      await updateBlacklists(token, draft);
      setMessage('Blacklists updated.');
      refetch();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-xs text-slate-400">Loading blacklists…</p>;
  if (loadError) return <p className="text-xs text-red-600">{loadError}</p>;

  return (
    <div className="space-y-8 max-w-2xl">
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

      <BlacklistSection
        title="Companies"
        items={draft.blacklisted_companies}
        inputValue={inputs.companies}
        onInputChange={(v) => setInputs((i) => ({ ...i, companies: v }))}
        onAdd={() => addItem('blacklisted_companies', 'companies')}
        onRemove={(idx) => removeItem('blacklisted_companies', idx)}
        placeholder="Company name"
      />
      <BlacklistSection
        title="Roles"
        items={draft.blacklisted_roles}
        inputValue={inputs.roles}
        onInputChange={(v) => setInputs((i) => ({ ...i, roles: v }))}
        onAdd={() => addItem('blacklisted_roles', 'roles')}
        onRemove={(idx) => removeItem('blacklisted_roles', idx)}
        placeholder="Role pattern"
      />
      <BlacklistSection
        title="Locations (ISO-2)"
        items={draft.blacklisted_locations}
        inputValue={inputs.locations}
        onInputChange={(v) => setInputs((i) => ({ ...i, locations: v }))}
        onAdd={() => addItem('blacklisted_locations', 'locations')}
        onRemove={(idx) => removeItem('blacklisted_locations', idx)}
        placeholder="e.g. US"
      />

      <button
        type="button"
        disabled={saving}
        onClick={() => void handleSave()}
        className="px-5 py-2 bg-accent hover:bg-accent-hover text-white text-[14px] font-medium rounded-full px-5 py-2.5 cursor-pointer disabled:opacity-50"
      >
        {saving ? 'Saving…' : 'Save blacklists'}
      </button>
    </div>
  );
}

function BlacklistSection({
  title,
  items,
  inputValue,
  onInputChange,
  onAdd,
  onRemove,
  placeholder,
}: {
  title: string;
  items: string[];
  inputValue: string;
  onInputChange: (v: string) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
  placeholder: string;
}) {
  return (
    <div className="sophisticated-card p-5 rounded-xl space-y-3">
      <p className="text-[14px] font-medium text-accent">{title}</p>
      <div className="flex gap-2">
        <input
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), onAdd())}
          placeholder={placeholder}
          className="flex-1 bg-canvas border border-line rounded-xl px-3 py-2 text-xs"
        />
        <button
          type="button"
          onClick={onAdd}
          className="px-3 py-2 border border-line text-[14px] font-medium rounded-xl cursor-pointer hover:border-accent/50"
        >
          Add
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map((item, idx) => (
          <span
            key={`${item}-${idx}`}
            className="inline-flex items-center gap-1 px-2 py-1 text-[10px] bg-soft border border-line rounded-xl"
          >
            {item}
            <button type="button" onClick={() => onRemove(idx)} className="cursor-pointer hover:text-red-600">
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}
