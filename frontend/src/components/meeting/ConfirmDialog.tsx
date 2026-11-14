import React, { useEffect, useRef } from "react";
import { AlertTriangle, Loader2, X } from "lucide-react";

interface ConfirmDialogProps {
  isOpen: boolean;
  type: "cancel" | "delete" | null;
  meetingTitle: string;
  isLoading?: boolean;
  error?: string | null;
  onConfirm: () => void;
  onClose: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  type,
  meetingTitle,
  isLoading = false,
  error = null,
  onConfirm,
  onClose,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  const isCancel = type === "cancel";
  const titleText = isCancel ? "Cancel Meeting" : "Delete Meeting";
  const confirmText = isCancel ? "Cancel Meeting" : "Delete Meeting";
  const bodyText = isCancel
    ? `Are you sure you want to cancel "${meetingTitle}"? Participants will no longer be able to join this session.`
    : `Are you sure you want to permanently delete "${meetingTitle}"? This action cannot be undone and meeting history will be removed.`;

  // Focus trap and Escape key listener
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isLoading) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    confirmButtonRef.current?.focus();

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen || !type) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-desc"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in"
    >
      <div
        ref={dialogRef}
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-gray-100 transition-all"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${isCancel ? "bg-amber-50 text-amber-600" : "bg-red-50 text-red-600"}`}>
              <AlertTriangle className="h-5 w-5" aria-hidden="true" />
            </div>
            <h3 id="confirm-dialog-title" className="text-base font-semibold text-gray-900">
              {titleText}
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            aria-label="Close dialog"
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <p id="confirm-dialog-desc" className="mt-3.5 text-xs text-gray-600 leading-relaxed">
          {bodyText}
        </p>

        {error && (
          <div className="mt-3 rounded-xl bg-red-50 p-2.5 text-xs text-red-700">
            {error}
          </div>
        )}

        <div className="mt-6 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-300 transition-colors cursor-pointer"
          >
            Keep Meeting
          </button>
          <button
            ref={confirmButtonRef}
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold text-white shadow-xs focus-visible:outline-none focus-visible:ring-2 disabled:opacity-50 transition-colors cursor-pointer ${
              isCancel
                ? "bg-amber-600 hover:bg-amber-700 focus-visible:ring-amber-500/40"
                : "bg-red-600 hover:bg-red-700 focus-visible:ring-red-500/40"
            }`}
          >
            {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />}
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

