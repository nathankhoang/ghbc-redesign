"use client";

/**
 * Generic fixed-overlay confirm modal for imperative, destructive-ish owner
 * actions (pause/resume/cancel membership, cancel a class, etc.). Pattern
 * mirrors the booking confirm modal in components/schedule-booking.tsx.
 */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  danger = false,
  pending = false,
  error,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  pending?: boolean;
  error?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 p-4 backdrop-blur-sm"
      onClick={() => !pending && onCancel()}
    >
      <div
        className="w-full max-w-sm rounded-3xl border border-oxblood-600/60 bg-oxblood/40 p-7"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-poster text-2xl text-bone">{title}</h3>
        <p className="mt-3 text-cream/80">{message}</p>
        {error && <p className="mt-3 text-sm text-blood">{error}</p>}
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={pending}
            className="font-condensed flex-1 rounded-full border border-cream/30 py-3 text-sm tracking-widest text-cream uppercase disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending}
            className={`font-condensed flex-1 rounded-full py-3 text-sm font-semibold tracking-widest uppercase disabled:opacity-60 ${
              danger
                ? "bg-blood text-bone hover:bg-blood/80"
                : "bg-gold text-ink hover:bg-bone"
            }`}
          >
            {pending ? "…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
