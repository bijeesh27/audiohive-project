import React from "react";
import type { LucideIcon } from "lucide-react";
import { ArrowUpRight } from "lucide-react";

interface StatCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  helperText?: string;
  trendText?: string;
  iconBgColor?: string;
  iconColor?: string;
  onClick?: () => void;
  accentGradient?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon: Icon,
  helperText,
  trendText,
  iconBgColor = "bg-indigo-50",
  iconColor = "text-indigo-600",
  onClick,
  accentGradient = false,
}) => {
  return (
    <div
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(e) => {
        if (onClick && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onClick();
        }
      }}
      className={`group relative h-full flex flex-col justify-between rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
        onClick ? "cursor-pointer" : ""
      } ${
        accentGradient
          ? "border-indigo-100/60 bg-gradient-to-br from-white via-indigo-50/20 to-purple-50/30"
          : ""
      }`}
    >
      <div className="flex items-center justify-between">
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconBgColor}`}>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
        {onClick && (
          <span className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-300 transition-all duration-200 group-hover:bg-indigo-50 group-hover:text-indigo-600">
            <ArrowUpRight className="h-4 w-4" />
          </span>
        )}
      </div>

      <div className="mt-4 flex-1 flex flex-col justify-end">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-gray-900">{value}</span>
          {trendText && (
            <span className="text-xs font-medium text-emerald-600">{trendText}</span>
          )}
        </div>
        <p className="mt-1 text-sm font-semibold text-gray-800">{label}</p>
        <p className="mt-0.5 text-xs text-gray-500 line-clamp-1">
          {helperText || "\u00A0"}
        </p>
      </div>
    </div>
  );
};
