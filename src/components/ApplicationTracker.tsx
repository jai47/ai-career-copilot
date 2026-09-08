import { useEffect, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { ChevronLeft, ChevronRight, AlertTriangle, Trash2, GripVertical } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';
import { useAsync } from '../hooks/useAsync';
import { deleteApplication, listApplications, updateApplication } from '../api/applications';
import { ApiError } from '../api/client';
import { APPLICATION_STATUSES, type ApplicationResponse, type ApplicationStatus } from '../types';
import { SUB_STATUS_OPTIONS } from '../constants';
import { EmptyState, ErrorState, LoadingState } from '../components/ui/AsyncStates';
import { GradeChip, LowMatchWarning, ScoreBreakdown } from './GradeDisplay';
import CoverLetterPanel from './CoverLetterPanel';
import InterviewPrepPanel from './InterviewPrepPanel';
import NetworkOutreachPanel from './NetworkOutreachPanel';
import ApplyPacketPanel from './ApplyPacketPanel';
import CompanyResearchPanel from './CompanyResearchPanel';
import MessagePackPanel from './MessagePackPanel';
import InterviewPackPanel from './InterviewPackPanel';
import ReplyCoachPanel from './ReplyCoachPanel';
import StageTimeline from './StageTimeline';

const COLUMN_LABELS: Record<ApplicationStatus, string> = {
  approved: 'Approved',
  applied: 'Applied',
  interviewing: 'Interviewing',
  offer: 'Offer',
  accepted: 'Accepted',
  rejected: 'Rejected',
};

function isApplicationStatus(value: string): value is ApplicationStatus {
  return (APPLICATION_STATUSES as string[]).includes(value);
}

interface AppCardProps {
  app: ApplicationResponse;
  selected: boolean;
  scoreThreshold: number;
  deleting: boolean;
  onSelect: () => void;
  onMove: (direction: 'prev' | 'next') => void;
  onRemove: () => void;
  dragging?: boolean;
  overlay?: boolean;
}

function AppCard({
  app,
  selected,
  scoreThreshold,
  deleting,
  onSelect,
  onMove,
  onRemove,
  dragging = false,
  overlay = false,
}: AppCardProps) {
  return (
    <div
      role="button"
      tabIndex={overlay ? -1 : 0}
      onClick={onSelect}
      onKeyDown={(e) => e.key === 'Enter' && onSelect()}
      className={`p-2 rounded-xl border text-left transition-colors ${
        overlay
          ? 'border-accent bg-surface shadow-[0_12px_28px_rgba(0,0,0,0.16)] cursor-grabbing'
          : dragging
            ? 'opacity-40 border-dashed border-line'
            : selected
              ? 'border-accent bg-soft cursor-grab'
              : 'border-line hover:border-accent/40 cursor-grab'
      }`}
    >
      <div className="flex items-start gap-1">
        {!overlay && (
          <span className="mt-0.5 text-muted shrink-0" aria-hidden>
            <GripVertical className="w-3 h-3" />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-xs text-ink truncate">{app.title}</p>
          <p className="text-[10px] text-accent truncate">{app.company}</p>
          <div className="flex items-center gap-1 mt-1">
            <GradeChip score={app.overall_score} />
            {app.overall_score != null && (
              <span className="text-[9px] font-mono text-slate-400">
                {app.overall_score.toFixed(0)}
              </span>
            )}
          </div>
          {app.overall_score != null && app.overall_score < scoreThreshold && (
            <p className="text-[8px] text-amber-300/90 mt-0.5">Low match</p>
          )}
          {app.sub_status && app.status === 'interviewing' && (
            <p className="text-[8px] font-mono uppercase text-violet-300/90 mt-0.5">
              {app.sub_status.replace(/_/g, ' ')}
              {app.time_in_stage_days != null && ` · ${app.time_in_stage_days}d`}
            </p>
          )}
          {app.cover_letter_status && (
            <p className="text-[8px] font-mono uppercase text-sky-300/90 mt-0.5">
              Letter: {app.cover_letter_status}
            </p>
          )}
          {(app.is_follow_up_overdue || app.is_second_follow_up_overdue) && (
            <p className="text-[9px] text-amber-300 flex items-center gap-1 mt-1">
              <AlertTriangle className="w-3 h-3" /> Follow-up overdue
            </p>
          )}
          {!overlay && (
            <div className="flex gap-1 mt-2 items-center">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onMove('prev');
                }}
                className="p-0.5 hover:text-accent cursor-pointer"
                aria-label="Move to previous stage"
              >
                <ChevronLeft className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onMove('next');
                }}
                className="p-0.5 hover:text-accent cursor-pointer"
                aria-label="Move to next stage"
              >
                <ChevronRight className="w-3 h-3" />
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove();
                }}
                className="p-0.5 ml-auto text-slate-400 hover:text-red-600 cursor-pointer disabled:opacity-50"
                aria-label="Remove from tracker"
                title="Remove from tracker"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DraggableAppCard(
  props: Omit<AppCardProps, 'dragging' | 'overlay'> & { id: string },
) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: props.id,
    data: { type: 'application', status: props.app.status },
  });

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={isDragging ? 'relative z-10' : undefined}
    >
      <AppCard {...props} dragging={isDragging} />
    </div>
  );
}

function StatusColumn({
  status,
  apps,
  selectedId,
  scoreThreshold,
  deleting,
  isOver,
  onSelect,
  onMove,
  onRemove,
}: {
  status: ApplicationStatus;
  apps: ApplicationResponse[];
  selectedId: string | null;
  scoreThreshold: number;
  deleting: boolean;
  isOver: boolean;
  onSelect: (app: ApplicationResponse) => void;
  onMove: (app: ApplicationResponse, direction: 'prev' | 'next') => void;
  onRemove: (app: ApplicationResponse) => void;
}) {
  const { setNodeRef } = useDroppable({
    id: status,
    data: { type: 'column', status },
  });

  return (
    <div
      ref={setNodeRef}
      className={`bg-surface border rounded-[18px] p-3 flex flex-col transition-colors ${
        isOver ? 'border-accent bg-soft/60 ring-2 ring-accent/20' : 'border-line'
      }`}
    >
      <div className="flex items-center justify-between mb-3 px-1">
        <h4 className="text-[12px] font-medium text-muted tracking-[0.04em] uppercase">
          {COLUMN_LABELS[status]}
        </h4>
        <span className="text-[11px] font-mono text-muted tabular-nums">{apps.length}</span>
      </div>
      <div className="space-y-2 flex-1 overflow-y-auto max-h-[400px] min-h-[72px]">
        {apps.map((app) => (
          <DraggableAppCard
            key={app.id}
            id={app.id}
            app={app}
            selected={selectedId === app.id}
            scoreThreshold={scoreThreshold}
            deleting={deleting}
            onSelect={() => onSelect(app)}
            onMove={(direction) => onMove(app, direction)}
            onRemove={() => onRemove(app)}
          />
        ))}
        {apps.length === 0 && (
          <p
            className={`text-[11px] text-center py-6 rounded-xl border border-dashed ${
              isOver ? 'border-accent text-accent' : 'border-line text-muted'
            }`}
          >
            Drop here
          </p>
        )}
      </div>
    </div>
  );
}

export default function ApplicationTracker() {
  const { token } = useAuth();
  const { profile } = useProfile();
  const scoreThreshold = profile?.score_warning_threshold ?? 40;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<ApplicationStatus>('approved');
  const [subStatus, setSubStatus] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [apps, setApps] = useState<ApplicationResponse[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overColumn, setOverColumn] = useState<ApplicationStatus | null>(null);

  const { data, loading, error, refetch } = useAsync(
    (signal) => {
      if (!token) return Promise.reject(new Error('Not authenticated'));
      return listApplications(token, signal).then((r) => r.applications);
    },
    [token],
    Boolean(token),
  );

  useEffect(() => {
    if (data) setApps(data);
  }, [data]);

  const selected = apps.find((a) => a.id === selectedId) ?? null;
  const activeApp = activeId ? apps.find((a) => a.id === activeId) ?? null : null;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      // Avoid accidental drags when clicking to select / press buttons
      activationConstraint: { distance: 6 },
    }),
  );

  const selectApp = (app: ApplicationResponse) => {
    setSelectedId(app.id);
    setNotes(app.notes ?? '');
    setStatus(app.status);
    setSubStatus(app.sub_status ?? '');
  };

  const applyStatusChange = async (app: ApplicationResponse, next: ApplicationStatus) => {
    if (next === app.status || !token) return;
    const previous = apps;
    setApps((prev) => prev.map((a) => (a.id === app.id ? { ...a, status: next } : a)));
    if (selectedId === app.id) setStatus(next);
    setSaveError(null);
    try {
      await updateApplication(token, app.id, { status: next });
      refetch();
    } catch (err) {
      setApps(previous);
      if (selectedId === app.id) setStatus(app.status);
      setSaveError(err instanceof ApiError ? err.message : 'Update failed');
    }
  };

  const moveStatus = async (app: ApplicationResponse, direction: 'prev' | 'next') => {
    const idx = APPLICATION_STATUSES.indexOf(app.status);
    const next =
      direction === 'next'
        ? APPLICATION_STATUSES[Math.min(idx + 1, APPLICATION_STATUSES.length - 1)]
        : APPLICATION_STATUSES[Math.max(idx - 1, 0)];
    await applyStatusChange(app, next);
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
    setSaveError(null);
  };

  const resolveDropColumn = (
    overId: string | undefined,
    appsSnapshot: ApplicationResponse[],
  ): ApplicationStatus | null => {
    if (!overId) return null;
    if (isApplicationStatus(overId)) return overId;
    const overApp = appsSnapshot.find((a) => a.id === overId);
    return overApp?.status ?? null;
  };

  const handleDragOver = (event: DragOverEvent) => {
    const column = resolveDropColumn(
      event.over ? String(event.over.id) : undefined,
      apps,
    );
    setOverColumn(column);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setOverColumn(null);
    if (!over) return;

    const app = apps.find((a) => a.id === String(active.id));
    if (!app) return;

    const next = resolveDropColumn(String(over.id), apps);
    if (!next || next === app.status) return;

    void applyStatusChange(app, next);
  };

  const handleDragCancel = () => {
    setActiveId(null);
    setOverColumn(null);
  };

  const saveDetails = async () => {
    if (!token || !selectedId) return;
    setSaving(true);
    setSaveError(null);
    try {
      await updateApplication(token, selectedId, {
        status,
        sub_status: status === 'interviewing' ? subStatus || null : null,
        notes,
      });
      refetch();
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const removeApp = async (app: ApplicationResponse) => {
    if (!token) return;
    if (!window.confirm(`Remove ${app.title} @ ${app.company} from your tracker?`)) return;
    setDeleting(true);
    setSaveError(null);
    try {
      await deleteApplication(token, app.id);
      if (selectedId === app.id) setSelectedId(null);
      setApps((prev) => prev.filter((a) => a.id !== app.id));
      refetch();
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="page-title">Applications.</h1>
        <p className="page-subtitle">
          Drag cards between columns to update status — or use the arrows. No auto-apply.
        </p>
      </div>

      {saveError && (
        <div className="text-[14px] text-[#b00020] bg-[#fff2f2] border border-[#f5c2c2] px-4 py-3 rounded-[12px]">
          {saveError}
        </div>
      )}

      {!apps.length ? (
        <EmptyState message="No applications yet. Approve opportunities from Digest or Jobs." />
      ) : (
        <>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
          >
            <div
              data-coach-id="tracker-board"
              className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 min-h-[320px]"
            >
              {APPLICATION_STATUSES.map((col) => (
                <StatusColumn
                  key={col}
                  status={col}
                  apps={apps.filter((a) => a.status === col)}
                  selectedId={selectedId}
                  scoreThreshold={scoreThreshold}
                  deleting={deleting}
                  isOver={overColumn === col && activeId != null}
                  onSelect={selectApp}
                  onMove={moveStatus}
                  onRemove={removeApp}
                />
              ))}
            </div>

            <DragOverlay dropAnimation={null}>
              {activeApp ? (
                <div className="w-[180px]">
                  <AppCard
                    app={activeApp}
                    selected={false}
                    scoreThreshold={scoreThreshold}
                    deleting={false}
                    onSelect={() => {}}
                    onMove={() => {}}
                    onRemove={() => {}}
                    overlay
                  />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>

          {selected && (
            <div className="sophisticated-card p-5 rounded-xl space-y-4">
              <h3 className="text-sm text-ink flex items-center gap-2 flex-wrap">
                {selected.title} @ {selected.company}
                <GradeChip score={selected.overall_score} />
              </h3>
              <LowMatchWarning score={selected.overall_score} threshold={scoreThreshold} />
              <ScoreBreakdown dimensions={selected} defaultOpen />
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[14px] font-medium text-slate-400 block mb-1">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as ApplicationStatus)}
                    className="w-full bg-canvas border border-line rounded-xl px-2 py-2 text-xs"
                  >
                    {APPLICATION_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {COLUMN_LABELS[s]}
                      </option>
                    ))}
                  </select>
                </div>
                {status === 'interviewing' && (
                  <div>
                    <label className="text-[14px] font-medium text-slate-400 block mb-1">
                      Interview substage
                    </label>
                    <select
                      value={subStatus}
                      onChange={(e) => setSubStatus(e.target.value)}
                      className="w-full bg-canvas border border-line rounded-xl px-2 py-2 text-xs"
                    >
                      <option value="">—</option>
                      {SUB_STATUS_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              <div>
                <label className="text-[14px] font-medium text-slate-400 block mb-1">
                  Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  className="w-full bg-canvas border border-line rounded-xl px-3 py-2 text-xs resize-y"
                />
              </div>
              <button
                type="button"
                disabled={saving}
                onClick={() => void saveDetails()}
                className="px-4 py-2 bg-accent hover:bg-accent-hover text-white text-[14px] font-medium rounded-full px-5 py-2.5 cursor-pointer disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={() => void removeApp(selected)}
                className="inline-flex items-center gap-1.5 px-3 py-2 border border-red-200 text-red-600 text-[14px] font-medium rounded-xl cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {deleting ? 'Removing…' : 'Remove from tracker'}
              </button>
              <CoverLetterPanel
                applicationId={selected.id}
                company={selected.company}
                title={selected.title}
              />
              <ApplyPacketPanel applicationId={selected.id} />
              <CompanyResearchPanel
                company={selected.company}
                jobTitle={selected.title}
                applicationId={selected.id}
              />
              <MessagePackPanel applicationId={selected.id} />
              <NetworkOutreachPanel
                applicationId={selected.id}
                company={selected.company}
                title={selected.title}
              />
              <InterviewPrepPanel
                applicationId={selected.id}
                isInterviewing={selected.status === 'interviewing'}
              />
              <InterviewPackPanel applicationId={selected.id} />
              <ReplyCoachPanel applicationId={selected.id} />
              <StageTimeline applicationId={selected.id} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
