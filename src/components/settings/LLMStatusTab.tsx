import { useEffect, useState } from 'react';
import { useAsync } from '../../hooks/useAsync';
import {
  deleteMyLlmKey,
  getMyLlmKeys,
  patchLlmPreference,
  putMyLlmKey,
} from '../../api/billing';
import { useAuth } from '../../context/AuthContext';
import type { UserLlmProviderStatus } from '../../types';
import { LoadingState, ErrorState } from '../ui/AsyncStates';

export default function LLMStatusTab() {
  const { token } = useAuth();
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [selectedProviderId, setSelectedProviderId] = useState<string>('groq');
  const [draftKey, setDraftKey] = useState('');
  const [draftModel, setDraftModel] = useState('');

  const { data, loading, error, refetch } = useAsync(
    (signal) => {
      if (!token) return Promise.reject(new Error('Not authenticated'));
      return getMyLlmKeys(token, signal);
    },
    [token],
    Boolean(token),
  );

  const selected: UserLlmProviderStatus | undefined = data?.providers.find(
    (p) => p.id === selectedProviderId,
  );

  useEffect(() => {
    if (!data?.providers.length) return;
    const current = data.providers.find((p) => p.id === selectedProviderId);
    if (!current) {
      const firstByok = data.providers.find((p) => p.byok_supported) ?? data.providers[0];
      setSelectedProviderId(firstByok.id);
      return;
    }
    const nextModel =
      current.model ||
      current.models[0]?.id ||
      '';
    setDraftModel(nextModel);
    setDraftKey('');
  }, [data, selectedProviderId]);

  const handleRoutingChange = async (providerId: string) => {
    if (!token || !data || providerId === data.preferred_provider) return;
    setSaving(true);
    setSaveError(null);
    try {
      await patchLlmPreference(token, providerId);
      refetch();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save routing');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveKey = async () => {
    if (!token || !selected) return;
    const apiKey = draftKey.trim();
    if (!apiKey && !selected.configured) {
      setSaveError('Paste an API key before saving');
      return;
    }
    if (!draftModel && selected.models.length > 0) {
      setSaveError('Select a model');
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      await putMyLlmKey(token, selected.id, apiKey || null, draftModel || null);
      setDraftKey('');
      refetch();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save key');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteKey = async () => {
    if (!token || !selected) return;
    setSaving(true);
    setSaveError(null);
    try {
      await deleteMyLlmKey(token, selected.id);
      setDraftKey('');
      refetch();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to remove key');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingState message="Loading API keys…" />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;
  if (!data) return null;

  const byokProviders = data.providers.filter((p) => p.byok_supported);

  return (
    <div className="space-y-5 max-w-xl">
      <p className="text-xs text-slate-400">
        Bring your own key (free, no token charge) or use server keys from{' '}
        <span className="font-mono">.env</span> (charges app tokens). Keys are encrypted and only a
        short hint is shown after saving.
      </p>

      <div className="sophisticated-card p-4 rounded-xl space-y-2">
        <label htmlFor="llm-routing" className="text-sm text-ink block">
          How should Copilot call models?
        </label>
        <select
          id="llm-routing"
          value={data.preferred_provider}
          disabled={saving}
          onChange={(e) => handleRoutingChange(e.target.value)}
          className="w-full bg-surface border border-line text-ink text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-accent/60"
        >
          <option value="auto">Auto — my keys first, then server LLMs if needed</option>
          <option value="platform">Server LLMs only — charges tokens</option>
          {byokProviders.map((provider) => (
            <option key={provider.id} value={provider.id}>
              Prefer {provider.label}
              {provider.configured ? ` · your key · ${provider.model ?? 'model'}` : ' · add your key below'}
            </option>
          ))}
        </select>
        <p className="text-[11px] text-muted">
          Server mode ignores your BYOK keys and uses platform credentials. Failed BYOK calls still
          fall through to server keys in Auto mode (and then charge tokens).
        </p>
      </div>

      <div className="sophisticated-card p-4 rounded-xl space-y-4">
        <div className="space-y-2">
          <label htmlFor="byok-provider" className="text-sm text-ink block">
            Select provider
          </label>
          <select
            id="byok-provider"
            value={selectedProviderId}
            disabled={saving}
            onChange={(e) => setSelectedProviderId(e.target.value)}
            className="w-full bg-surface border border-line text-ink text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-accent/60"
          >
            {byokProviders.map((provider) => (
              <option key={provider.id} value={provider.id}>
                {provider.label}
                {provider.configured ? ` · saved ···${provider.key_hint ?? ''}` : ''}
              </option>
            ))}
          </select>
        </div>

        {selected && (
          <>
            <div className="flex items-center justify-between gap-3">
              <p className="text-[13px] text-muted">
                {selected.configured
                  ? `Key on file (···${selected.key_hint ?? ''}). Paste a new key to replace.`
                  : 'No key saved yet for this provider.'}
              </p>
              <span
                className={`shrink-0 text-[12px] font-medium px-2 py-1 rounded-xl ${
                  selected.configured
                    ? 'bg-emerald-950/30 border border-emerald-200 text-emerald-700'
                    : 'bg-soft border border-line text-slate-400'
                }`}
              >
                {selected.configured ? 'Saved' : 'Not set'}
              </span>
            </div>

            {selected.models.length > 0 && (
              <div className="space-y-2">
                <label htmlFor="byok-model" className="text-sm text-ink block">
                  Model
                </label>
                <select
                  id="byok-model"
                  value={draftModel}
                  disabled={saving}
                  onChange={(e) => setDraftModel(e.target.value)}
                  className="w-full bg-surface border border-line text-ink text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-accent/60"
                >
                  {selected.models.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-muted font-mono">{draftModel}</p>
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="byok-key" className="text-sm text-ink block">
                API key
              </label>
              <input
                id="byok-key"
                type="password"
                autoComplete="off"
                placeholder={
                  selected.id === 'deepseek'
                    ? 'Paste DeepSeek API key (sk-…)'
                    : selected.id === 'groq'
                      ? 'Paste Groq API key (gsk-…)'
                      : 'Paste API key'
                }
                value={draftKey}
                onChange={(e) => setDraftKey(e.target.value)}
                className="w-full bg-surface border border-line text-ink text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-accent/60 font-mono"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={saving}
                onClick={handleSaveKey}
                className="px-3 py-2 text-sm rounded-xl bg-ink text-white disabled:opacity-50"
              >
                {selected.configured ? 'Save model / key' : 'Save key'}
              </button>
              {selected.configured && (
                <button
                  type="button"
                  disabled={saving}
                  onClick={handleDeleteKey}
                  className="px-3 py-2 text-sm rounded-xl border border-line text-muted hover:text-ink"
                >
                  Remove key
                </button>
              )}
            </div>
          </>
        )}

        {saveError && <p className="text-xs text-red-600">{saveError}</p>}
        {saving && <p className="text-xs text-slate-400">Saving…</p>}
      </div>

      {byokProviders.some((p) => p.configured) && (
        <div className="text-[12px] text-muted space-y-1">
          <p className="font-medium text-ink">Saved keys</p>
          <ul className="space-y-1">
            {byokProviders
              .filter((p) => p.configured)
              .map((p) => (
                <li key={p.id}>
                  {p.label} · ···{p.key_hint} · {p.model ?? 'default model'}
                </li>
              ))}
          </ul>
        </div>
      )}
    </div>
  );
}
