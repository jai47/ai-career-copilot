import { useState } from 'react';
import { useAsync } from '../../hooks/useAsync';
import { getLlmStatus, updateLlmProvider } from '../../api/users';
import { useAuth } from '../../context/AuthContext';
import { LoadingState, ErrorState } from '../ui/AsyncStates';

export default function LLMStatusTab() {
  const { token } = useAuth();
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const { data, loading, error, refetch } = useAsync(
    (signal) => getLlmStatus(signal),
    [],
    true,
  );

  const handleProviderChange = async (providerId: string) => {
    if (!token || !data || providerId === data.selected_provider) return;
    setSaving(true);
    setSaveError(null);
    try {
      await updateLlmProvider(token, { provider: providerId });
      refetch();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save provider');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingState message="Loading LLM status…" />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;
  if (!data) return null;

  return (
    <div className="space-y-4 max-w-xl">
      <p className="text-xs text-slate-400">
        API keys are configured in the server <code className="text-accent">.env</code> file at
        deploy time. Values are never shown here. Choose a preferred provider below — the backend
        routes calls and falls back to other configured providers on failure.
      </p>
      <p className="text-xs text-slate-400">
        Resume parser mode:{' '}
        <span className="text-ink font-mono">{data.resume_parser_mode}</span>
      </p>

      <div className="sophisticated-card p-4 rounded-xl space-y-2">
        <label htmlFor="llm-provider" className="text-sm text-ink block">
          Preferred model provider
        </label>
        <select
          id="llm-provider"
          value={data.selected_provider}
          disabled={saving}
          onChange={(e) => handleProviderChange(e.target.value)}
          className="w-full bg-surface border border-line text-ink text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-accent/60"
        >
          {data.providers.map((provider) => (
            <option key={provider.id} value={provider.id}>
              {provider.label}
              {provider.id !== 'auto' && !provider.configured ? ' (not configured)' : ''}
            </option>
          ))}
        </select>
        {saveError && <p className="text-xs text-red-600">{saveError}</p>}
        {saving && <p className="text-xs text-slate-400">Saving…</p>}
      </div>

      <div className="grid gap-3">
        {data.providers
          .filter((p) => p.id !== 'auto')
          .map((row) => (
            <div
              key={row.id}
              className="sophisticated-card p-4 rounded-xl flex items-center justify-between gap-4"
            >
              <div className="min-w-0">
                <p className="text-sm text-ink">{row.label}</p>
                {row.model && (
                  <p className="text-[10px] font-mono text-slate-400 mt-0.5 truncate">
                    {row.model}
                  </p>
                )}
                {row.env_keys.length > 0 && (
                  <p className="text-[10px] font-mono text-slate-400 mt-1">
                    {row.env_keys.join(', ')}
                  </p>
                )}
              </div>
              <span
                className={`shrink-0 text-[14px] font-medium px-2 py-1 rounded-xl ${
                  row.configured
                    ? 'bg-emerald-950/30 border border-emerald-200 text-emerald-200'
                    : 'bg-soft border border-line text-slate-400'
                }`}
              >
                {row.configured ? 'Configured' : 'Not set'}
              </span>
            </div>
          ))}
      </div>
    </div>
  );
}
