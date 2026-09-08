import { Loader2, AlertCircle } from 'lucide-react';

export function LoadingState({ message = 'Loading…' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-muted">
      <Loader2 className="w-6 h-6 animate-spin text-accent mb-4" strokeWidth={1.75} />
      <p className="text-[15px] tracking-[-0.01em]">{message}</p>
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <AlertCircle className="w-6 h-6 mb-4 text-[#b00020]" strokeWidth={1.75} />
      <p className="text-[15px] text-ink max-w-md tracking-[-0.01em]">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-6 px-5 py-2.5 text-[14px] font-medium rounded-full bg-ink text-white hover:bg-ink/90 transition-colors cursor-pointer"
        >
          Try again
        </button>
      )}
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-16 text-[15px] text-muted tracking-[-0.01em] border border-dashed border-line rounded-[18px] bg-surface/60">
      {message}
    </div>
  );
}
