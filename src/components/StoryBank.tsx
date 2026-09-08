import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAsync } from '../hooks/useAsync';
import { createStory, deleteStory, draftStoryWithAi, listStories, updateStory } from '../api/stories';
import { ApiError } from '../api/client';
import { STAR_TAGS } from '../constants';
import type { StoryResponse } from '../types';
import { EmptyState, ErrorState, LoadingState } from './ui/AsyncStates';

export default function StoryBank() {
  const { token } = useAuth();
  const [tagFilter, setTagFilter] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<StoryResponse | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data, loading, error: loadError, refetch } = useAsync(
    (signal) => {
      if (!token) return Promise.reject(new Error('Not authenticated'));
      return listStories(
        token,
        { tag: tagFilter || undefined, q: search || undefined },
        signal,
      );
    },
    [token, tagFilter, search],
    Boolean(token),
  );

  const handleCreate = async () => {
    if (!token) return;
    setSaving(true);
    setError(null);
    try {
      const story = await createStory(token, {
        title: 'New story',
        tags: [STAR_TAGS[0]],
        status: 'draft',
      });
      setSelected(story);
      refetch();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Create failed');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!token || !selected) return;
    setSaving(true);
    setError(null);
    try {
      await updateStory(token, selected.id, {
        title: selected.title,
        tags: selected.tags,
        situation: selected.situation,
        task: selected.task,
        action: selected.action,
        result: selected.result,
        reflection: selected.reflection,
        status: selected.status,
      });
      refetch();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!token) return;
    setError(null);
    try {
      await deleteStory(token, id);
      if (selected?.id === id) setSelected(null);
      refetch();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Delete failed');
    }
  };

  const handleAiDraft = async (tag: string) => {
    if (!token) return;
    setSaving(true);
    try {
      const story = await draftStoryWithAi(token, tag);
      setSelected(story);
      refetch();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'AI draft failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingState />;
  if (loadError) return <ErrorState message={loadError} onRetry={refetch} />;

  const items = data?.items ?? [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="page-title">Stories.</h1>
        <p className="page-subtitle">STAR stories ready for interviews and outreach.</p>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <input
          type="search"
          placeholder="Search stories…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-surface border border-line rounded-full px-4 py-2.5 text-[14px] max-w-xs"
        />
        <select
          value={tagFilter}
          onChange={(e) => setTagFilter(e.target.value)}
          className="bg-surface border border-line rounded-full px-3 py-2.5 text-[14px]"
        >
          <option value="">All tags</option>
          {STAR_TAGS.map((t) => (
            <option key={t} value={t}>
              {t.replace(/_/g, ' ')}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => void handleCreate()}
          disabled={saving}
          className="flex items-center gap-1 px-3 py-1.5 text-[13px] font-medium bg-accent hover:bg-accent-hover text-white rounded-full"
        >
          <Plus className="w-3 h-3" /> New story
        </button>
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="space-y-2 max-h-[480px] overflow-y-auto">
          {!items.length ? (
            <EmptyState message="No stories yet. Create one or use AI draft from a theme." />
          ) : (
            items.map((s) => (
              <div
                key={s.id}
                role="button"
                tabIndex={0}
                onClick={() => setSelected(s)}
                className={`p-3 border rounded-xl cursor-pointer ${
                  selected?.id === s.id ? 'border-accent bg-soft' : 'border-line'
                }`}
              >
                <div className="flex justify-between gap-2">
                  <p className="text-xs text-ink">{s.title}</p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      void handleDelete(s.id);
                    }}
                    className="text-muted hover:text-red-600"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
                <p className="text-[10px] text-muted mt-1">
                  {s.status} · {s.tags.join(', ')}
                </p>
              </div>
            ))
          )}
        </div>

        <div className="border border-line rounded-xl p-4 space-y-3">
          {selected ? (
            <>
              <input
                value={selected.title}
                onChange={(e) => setSelected({ ...selected, title: e.target.value })}
                className="w-full bg-canvas border border-line rounded-xl px-2 py-1.5 text-sm"
              />
              <select
                value={selected.status}
                onChange={(e) =>
                  setSelected({ ...selected, status: e.target.value as 'draft' | 'ready' })
                }
                className="bg-canvas border border-line rounded-xl px-2 py-1 text-xs"
              >
                <option value="draft">Draft</option>
                <option value="ready">Ready</option>
              </select>
              {(['situation', 'task', 'action', 'result', 'reflection'] as const).map((field) => (
                <div key={field}>
                  <label className="text-[13px] font-medium text-muted">{field}</label>
                  <textarea
                    value={selected[field] ?? ''}
                    onChange={(e) => setSelected({ ...selected, [field]: e.target.value })}
                    rows={2}
                    className="w-full mt-0.5 bg-canvas border border-line rounded-xl px-2 py-1 text-xs"
                  />
                </div>
              ))}
              <button
                type="button"
                disabled={saving}
                onClick={() => void handleSave()}
                className="px-4 py-2 bg-accent text-white text-[13px] font-medium rounded-full"
              >
                Save story
              </button>
            </>
          ) : (
            <div className="text-xs text-muted space-y-2">
              <p>Select a story to edit, or draft with AI:</p>
              <div className="flex flex-wrap gap-1">
                {STAR_TAGS.slice(0, 8).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => void handleAiDraft(t)}
                    className="px-2 py-0.5 text-[10px] border border-line rounded-xl hover:border-accent/50"
                  >
                    {t.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
