import { X } from 'lucide-react';
import OpportunityDetailPanel from './OpportunityDetailPanel';
import { ErrorState, LoadingState } from './ui/AsyncStates';
import type { OpportunityDetail, RejectReason } from '../types';

interface OpportunityDetailDrawerProps {
  open: boolean;
  onClose: () => void;
  loading: boolean;
  error: string | null;
  detail: OpportunityDetail | null;
  busy?: boolean;
  scoreWarningThreshold: number;
  onRetry?: () => void;
  onApprove: (id: string) => void;
  onSkip: (id: string) => void;
  onReject: (id: string, reason: RejectReason) => void;
}

export default function OpportunityDetailDrawer({
  open,
  onClose,
  loading,
  error,
  detail,
  busy,
  scoreWarningThreshold,
  onRetry,
  onApprove,
  onSkip,
  onReject,
}: OpportunityDetailDrawerProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button type="button" className="flex-1 bg-slate-900/20 backdrop-blur-[1px]" onClick={onClose} aria-label="Close" />
      <div className="w-full max-w-lg bg-surface border-l border-line h-full overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold tracking-[-0.02em] uppercase tracking-widest text-accent">
            Opportunity details
          </h3>
          <button type="button" onClick={onClose} className="text-muted hover:text-ink">
            <X className="w-4 h-4" />
          </button>
        </div>
        {loading ? (
          <LoadingState message="Loading details…" />
        ) : error ? (
          <ErrorState message={error} onRetry={onRetry} />
        ) : detail ? (
          <OpportunityDetailPanel
            detail={detail}
            busy={busy}
            scoreWarningThreshold={scoreWarningThreshold}
            onApprove={onApprove}
            onSkip={onSkip}
            onReject={onReject}
            className="space-y-4"
          />
        ) : null}
      </div>
    </div>
  );
}
