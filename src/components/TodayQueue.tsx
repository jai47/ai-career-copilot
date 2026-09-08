import { useEffect, useMemo, useState } from 'react';
import { Calendar, Scale } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAsync } from '../hooks/useAsync';
import {
  analyzeResumeScore,
  autopilotChat,
  compareOffers,
  downloadAutopilotCalendar,
  generateWeeklyPlan,
  getResumeScore,
  getTodayQueue,
  getWeeklyPlan,
  listMasterResumes,
  updateMasterResume,
} from '../api/autopilot';
import { listApplications } from '../api/applications';
import { ApiError } from '../api/client';
import type {
  AutopilotChatResponse,
  OfferCompareResponse,
  ResumeScoreResponse,
  WeeklyPlanResponse,
} from '../types';
import { EmptyState, ErrorState, LoadingState } from './ui/AsyncStates';
import ReplyCoachPanel from './ReplyCoachPanel';
import NetworkingAgentPanel from './NetworkingAgentPanel';
import AutoPipelinePanel from './AutoPipelinePanel';
import CompanyResearchPanel from './CompanyResearchPanel';
import GrowthScorersPanel from './GrowthScorersPanel';

export default function TodayQueue() {
  const { token } = useAuth();
  const [chatInput, setChatInput] = useState('');
  const [chatBusy, setChatBusy] = useState(false);
  const [chat, setChat] = useState<AutopilotChatResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resumeScore, setResumeScore] = useState<ResumeScoreResponse | null>(null);
  const [weekly, setWeekly] = useState<WeeklyPlanResponse | null>(null);
  const [offerResult, setOfferResult] = useState<OfferCompareResponse | null>(null);
  const [selectedOffers, setSelectedOffers] = useState<string[]>([]);
  const [personaBusy, setPersonaBusy] = useState<string | null>(null);

  const queue = useAsync(
    (signal) => {
      if (!token) return Promise.reject(new Error('Not authenticated'));
      return getTodayQueue(token, signal);
    },
    [token],
    Boolean(token),
  );

  const apps = useAsync(
    (signal) => {
      if (!token) return Promise.reject(new Error('Not authenticated'));
      return listApplications(token, signal).then((r) => r.applications);
    },
    [token],
    Boolean(token),
  );

  const masters = useAsync(
    (signal) => {
      if (!token) return Promise.reject(new Error('Not authenticated'));
      return listMasterResumes(token, signal).then((r) => r.resumes);
    },
    [token],
    Boolean(token),
  );

  const offerCandidates = useMemo(
    () =>
      (apps.data ?? []).filter((a) =>
        ['offer', 'accepted', 'interviewing'].includes(String(a.status)),
      ),
    [apps.data],
  );

  useEffect(() => {
    if (!token) return;
    void (async () => {
      try {
        setResumeScore(await getResumeScore(token));
      } catch (err) {
        if (!(err instanceof ApiError && err.statusCode === 404)) {
          /* ignore soft load errors on mount */
        }
      }
      try {
        setWeekly(await getWeeklyPlan(token));
      } catch {
        /* optional */
      }
    })();
  }, [token]);

  const handleChat = async () => {
    if (!token || !chatInput.trim()) return;
    setChatBusy(true);
    setError(null);
    try {
      setChat(await autopilotChat(token, { message: chatInput.trim() }));
      setChatInput('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Chat failed');
    } finally {
      setChatBusy(false);
    }
  };

  const handleCalendar = async () => {
    if (!token) return;
    try {
      const blob = await downloadAutopilotCalendar(token);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'career-copilot-autopilot.ics';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Calendar download failed');
    }
  };

  const toggleOffer = (id: string) => {
    setSelectedOffers((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  };

  if (queue.loading && !queue.data) return <LoadingState />;
  if (queue.error) return <ErrorState message={queue.error} onRetry={queue.refetch} />;
  if (!queue.data) return <EmptyState message="No Today Queue data." />;

  const data = queue.data;

  return (
    <div className="space-y-10">
      <div
        data-coach-id="today-header"
        className="flex flex-wrap items-end justify-between gap-4"
      >
        <div>
          <h1 className="page-title">Today.</h1>
          <p className="page-subtitle">{data.tip}</p>
        </div>
        <button
          type="button"
          onClick={() => void handleCalendar()}
          className="text-[14px] font-medium px-5 py-2.5 border border-line rounded-full bg-surface text-ink hover:bg-soft inline-flex items-center gap-2 transition-colors"
        >
          <Calendar className="w-4 h-4 text-muted" strokeWidth={1.75} />
          Add to calendar
        </button>
      </div>

      {error && (
        <div className="text-[14px] text-[#b00020] bg-[#fff2f2] border border-[#f5c2c2] px-4 py-3 rounded-[12px]">
          {error}
        </div>
      )}

      <section data-coach-id="today-jobs" className="space-y-3">
        <h3 className="section-label">Jobs to act on</h3>
        {data.opportunities.length === 0 ? (
          <EmptyState message="No unscored high-score opportunities right now." />
        ) : (
          <ul className="space-y-2">
            {data.opportunities.map((o) => (
              <li
                key={o.opportunity_id}
                className="border border-line bg-surface rounded-[18px] px-5 py-4 flex justify-between gap-3 text-[14px]"
              >
                <div>
                  <p className="text-ink">
                    {o.title} @ {o.company}
                  </p>
                  <p className="text-slate-400">Score {o.overall_score ?? '—'}</p>
                </div>
                <Link to="/opportunities" className="text-accent self-center">
                  Review
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section data-coach-id="today-followups" className="space-y-2">
        <h3 className="section-label">Overdue follow-ups</h3>
        {data.follow_ups.length === 0 ? (
          <p className="text-xs text-slate-400">None overdue.</p>
        ) : (
          <ul className="space-y-2">
            {data.follow_ups.map((f) => (
              <li key={`${f.kind}-${f.id}`} className="border border-line bg-surface px-3 py-2 text-xs">
                <p className="text-ink">{f.label}</p>
                <p className="text-amber-700">
                  {f.detail} · due {f.due}
                </p>
                <Link
                  to={f.kind === 'network' ? '/networks' : '/tracker'}
                  className="text-accent text-[13px] font-medium"
                >
                  Open
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-2">
        <h3 className="section-label">Packet gaps</h3>
        {data.packet_gaps.length === 0 ? (
          <p className="text-xs text-slate-400">All recent packets look complete.</p>
        ) : (
          <ul className="space-y-2">
            {data.packet_gaps.map((p) => (
              <li key={p.application_id} className="border border-line bg-surface px-3 py-2 text-xs">
                <p className="text-ink">
                  {p.title} @ {p.company}
                </p>
                <p className="text-slate-400">Missing: {p.missing.join(', ')}</p>
                <Link to="/tracker" className="text-accent text-[13px] font-medium">
                  Open tracker
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {data.interview_nudges.length > 0 && (
        <section className="space-y-2">
          <h3 className="section-label">Interview mode</h3>
          <ul className="space-y-2">
            {data.interview_nudges.map((n) => (
              <li key={n.application_id} className="border border-line bg-surface px-3 py-2 text-xs">
                <p className="text-ink">
                  {n.title} @ {n.company}
                  {n.sub_status ? ` · ${n.sub_status}` : ''}
                </p>
                <Link to="/tracker" className="text-accent text-[13px] font-medium">
                  Open interview pack
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        <div className="border border-line bg-surface p-4 space-y-3">
          <h3 className="section-label">Resume Score</h3>
          <button
            type="button"
            onClick={async () => {
              if (!token) return;
              try {
                setResumeScore(await analyzeResumeScore(token));
              } catch (err) {
                setError(err instanceof ApiError ? err.message : 'Score failed');
              }
            }}
            className="section-label px-3 py-2 border border-accent/30 text-accent bg-accent-soft"
          >
            Analyze master resume
          </button>
          {resumeScore && (
            <div className="text-xs space-y-2">
              <p className="text-3xl text-accent font-semibold tracking-[-0.02em]">{resumeScore.overall_score}</p>
              <p className="text-slate-600">{resumeScore.summary}</p>
              <ul className="list-disc list-inside text-slate-400">
                {resumeScore.quick_wins.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="border border-line bg-surface p-4 space-y-3">
          <h3 className="section-label">Weekly skill plan</h3>
          <button
            type="button"
            onClick={async () => {
              if (!token) return;
              try {
                setWeekly(await generateWeeklyPlan(token));
              } catch (err) {
                setError(err instanceof ApiError ? err.message : 'Plan failed');
              }
            }}
            className="section-label px-3 py-2 border border-accent/30 text-accent bg-accent-soft"
          >
            Generate weekly plan
          </button>
          {weekly && (
            <div className="text-xs space-y-2">
              <p className="text-slate-400">{weekly.period_label}</p>
              {weekly.focus_skills.length > 0 && (
                <p className="text-slate-500">Focus: {weekly.focus_skills.join(', ')}</p>
              )}
              <ul className="space-y-2">
                {weekly.actions.map((a) => (
                  <li key={a.action} className="border border-line bg-soft p-2">
                    <p className="text-ink">{a.action}</p>
                    <p className="text-slate-400">
                      {a.why} · {a.effort}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <div className="border border-line bg-surface p-4 space-y-3">
        <h3 className="section-label">Resume personas</h3>
        <p className="text-[11px] text-slate-400">
          Label masters and set one active for tailoring. Upload additional resumes in Settings.
        </p>
        <ul className="space-y-2">
          {(masters.data ?? []).map((r) => (
            <li
              key={r.id}
              className="flex flex-wrap items-center gap-2 text-xs border border-line px-2 py-2"
            >
              <input
                defaultValue={r.label ?? ''}
                placeholder="Persona label"
                className="bg-soft border border-line px-2 py-1 text-ink"
                id={`label-${r.id}`}
              />
              <button
                type="button"
                disabled={personaBusy === r.id}
                onClick={async () => {
                  if (!token) return;
                  const el = document.getElementById(`label-${r.id}`) as HTMLInputElement | null;
                  setPersonaBusy(r.id);
                  try {
                    await updateMasterResume(token, r.id, {
                      label: el?.value || null,
                      is_active: true,
                    });
                    await masters.refetch();
                  } catch (err) {
                    setError(err instanceof ApiError ? err.message : 'Update failed');
                  } finally {
                    setPersonaBusy(null);
                  }
                }}
                className="text-[13px] font-medium text-accent border border-accent/30 px-2 py-1"
              >
                {r.is_active ? 'Save + keep active' : 'Save + activate'}
              </button>
              <span className="text-slate-400">
                {r.filename || r.id.slice(0, 8)}
                {r.is_active ? ' · active' : ''}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="border border-line bg-surface p-4 space-y-3">
        <h3 className="section-label flex items-center gap-2">
          <Scale className="w-4 h-4" /> Offer compare
        </h3>
        <div className="flex flex-wrap gap-2">
          {offerCandidates.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => toggleOffer(a.id)}
              className={`text-[13px] font-medium px-2 py-1 border ${
                selectedOffers.includes(a.id)
                  ? 'border-accent text-accent'
                  : 'border-line text-slate-500'
              }`}
            >
              {a.company} · {a.status}
            </button>
          ))}
        </div>
        <button
          type="button"
          disabled={selectedOffers.length < 2}
          onClick={async () => {
            if (!token) return;
            try {
              setOfferResult(await compareOffers(token, { application_ids: selectedOffers }));
            } catch (err) {
              setError(err instanceof ApiError ? err.message : 'Compare failed');
            }
          }}
          className="section-label px-3 py-2 border border-accent/30 text-accent bg-accent-soft disabled:opacity-50"
        >
          Compare selected
        </button>
        {offerResult && (
          <div className="text-xs space-y-2">
            <p className="text-slate-700">{offerResult.summary}</p>
            <ul className="list-disc list-inside text-slate-400">
              {offerResult.negotiation_bullets.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="border border-line bg-surface p-4 space-y-3 rounded-[18px]">
        <h3 className="section-label">Autopilot chat</h3>
        <p className="text-[14px] text-muted">
          Prefer the visual coach? Open the full chat with live cards and quick actions.
        </p>
        <Link
          to="/coach"
          className="inline-flex text-[14px] font-medium text-accent hover:underline"
        >
          Open Career Coach →
        </Link>
        <div className="flex gap-2">
          <input
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="What should I do next?"
            className="flex-1 bg-soft border border-line px-3 py-2 text-sm text-ink rounded-full"
          />
          <button
            type="button"
            disabled={chatBusy}
            onClick={() => void handleChat()}
            className="section-label px-3 py-2 border border-accent/30 text-accent bg-accent-soft disabled:opacity-50 rounded-full"
          >
            Ask
          </button>
        </div>
        {chat && (
          <div className="text-xs space-y-2">
            <p className="text-ink whitespace-pre-wrap">{chat.reply}</p>
            <ul className="space-y-1">
              {chat.suggested_actions.map((a) => (
                <li key={a.action + (a.application_id || '')} className="text-accent">
                  {a.label}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div data-coach-id="today-auto-pipeline">
        <AutoPipelinePanel />
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <CompanyResearchPanel />
        <GrowthScorersPanel />
      </div>
      <NetworkingAgentPanel />
      <ReplyCoachPanel />
    </div>
  );
}
