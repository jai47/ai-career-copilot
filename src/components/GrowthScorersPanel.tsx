import { useState } from 'react';
import { BookOpen, FolderKanban } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { scoreProject, scoreTraining } from '../api/autopilot';
import { ApiError } from '../api/client';
import type { ProjectScoreResponse, TrainingScoreResponse } from '../types';

export default function GrowthScorersPanel() {
  const { token } = useAuth();
  const [tab, setTab] = useState<'training' | 'project'>('training');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [hours, setHours] = useState('');
  const [money, setMoney] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [training, setTraining] = useState<TrainingScoreResponse | null>(null);
  const [project, setProject] = useState<ProjectScoreResponse | null>(null);

  const handleScore = async () => {
    if (!token || title.trim().length < 2) {
      setError('Enter a title.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      if (tab === 'training') {
        setTraining(
          await scoreTraining(token, {
            title: title.trim(),
            description: description.trim() || null,
            cost_hours: hours ? Number(hours) : null,
            cost_money: money ? Number(money) : null,
          }),
        );
        setProject(null);
      } else {
        setProject(
          await scoreProject(token, {
            title: title.trim(),
            description: description.trim() || null,
            estimated_hours: hours ? Number(hours) : null,
          }),
        );
        setTraining(null);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Scoring failed');
    } finally {
      setBusy(false);
    }
  };

  const result = tab === 'training' ? training : project;

  return (
    <section className="sophisticated-card p-6 space-y-4">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setTab('training')}
          className={`inline-flex items-center gap-1.5 px-4 py-2 text-[14px] font-medium rounded-full ${
            tab === 'training' ? 'bg-ink text-white' : 'border border-line text-muted'
          }`}
        >
          <BookOpen className="w-4 h-4" strokeWidth={1.75} /> Course / cert
        </button>
        <button
          type="button"
          onClick={() => setTab('project')}
          className={`inline-flex items-center gap-1.5 px-4 py-2 text-[14px] font-medium rounded-full ${
            tab === 'project' ? 'bg-ink text-white' : 'border border-line text-muted'
          }`}
        >
          <FolderKanban className="w-4 h-4" strokeWidth={1.75} /> Portfolio project
        </button>
      </div>
      <p className="text-[14px] text-muted">
        {tab === 'training'
          ? 'Score a course against your target roles and opportunity cost.'
          : 'Score a project idea against target roles and build time.'}
      </p>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={tab === 'training' ? 'Course title' : 'Project title'}
        className="w-full text-[14px] px-3 py-2.5 rounded-[12px] border border-line bg-surface"
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={3}
        placeholder="Short description…"
        className="w-full text-[14px] px-3 py-2.5 rounded-[12px] border border-line bg-soft"
      />
      <div className="grid sm:grid-cols-2 gap-3">
        <input
          value={hours}
          onChange={(e) => setHours(e.target.value)}
          placeholder={tab === 'training' ? 'Hours' : 'Estimated hours'}
          type="number"
          min={0}
          className="text-[14px] px-3 py-2.5 rounded-[12px] border border-line bg-surface"
        />
        {tab === 'training' && (
          <input
            value={money}
            onChange={(e) => setMoney(e.target.value)}
            placeholder="Cost (money)"
            type="number"
            min={0}
            className="text-[14px] px-3 py-2.5 rounded-[12px] border border-line bg-surface"
          />
        )}
      </div>
      {error && <p className="text-[14px] text-[#b00020]">{error}</p>}
      <button
        type="button"
        disabled={busy}
        onClick={() => void handleScore()}
        className="px-5 py-2.5 text-[14px] font-medium rounded-full bg-accent text-white disabled:opacity-50"
      >
        {busy ? 'Scoring…' : 'Score'}
      </button>
      {result && (
        <div className="border-t border-line pt-4 space-y-2 text-[14px]">
          <p className="font-semibold text-ink">
            {result.score}/100 · {result.verdict.replace('_', ' ')}
          </p>
          <p className="text-muted">{result.summary}</p>
          {'why' in result && result.why.length > 0 && (
            <ul className="list-disc list-inside text-muted">
              {result.why.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
