import React from "react";
import type { LucideIcon } from "lucide-react";
import { RefreshCw, AlertCircle } from "lucide-react";

interface SectionCardProps {
  title: string;
  icon?: LucideIcon;
  badge?: string | number;
  actionText?: string;
  onAction?: () => void;
  error?: string | null;
  onRetry?: () => void;
  children: React.ReactNode;
  className?: string;
}

export const SectionCard: React.FC<SectionCardProps> = ({
  title,
  icon: Icon,
  badge,
  actionText,
  onAction,
  error,
  onRetry,
  children,
  className = "",
}) => {
  return (
    <section
      className={`rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md ${className}`}
    >
      <div className="flex items-center justify-between border-b border-gray-100 pb-4 min-h-[44px]">
        <div className="flex items-center gap-2.5">
          {Icon && (
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <Icon className="h-4 w-4" />
            </div>
          )}
          <h2 className="text-base font-semibold text-gray-900 tracking-tight">{title}</h2>
          {badge !== undefined && (
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
              {badge}
            </span>
          )}
        </div>

        {actionText && onAction && !error && (
          <button
            type="button"
            onClick={onAction}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:underline transition-colors focus:outline-none"
          >
            {actionText}
          </button>
        )}
      </div>

      <div className="mt-4">
        {error ? (
          <div className="flex flex-col items-center justify-center rounded-xl bg-red-50/50 p-6 text-center ring-1 ring-red-100">
            <AlertCircle className="h-6 w-6 text-red-500" />
            <p className="mt-2 text-xs font-medium text-red-800">{error}</p>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-red-700 shadow-sm ring-1 ring-inset ring-red-200 hover:bg-red-50 transition-colors"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Retry
              </button>
            )}
          </div>
        ) : (
          children
        )}
      </div>
    </section>
  );
};
