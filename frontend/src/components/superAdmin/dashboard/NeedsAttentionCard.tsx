import React from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  Clock,
  ShieldBan,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import type { NeedsAttentionItem } from "../../../services/superAdminServices";
import { API_ROUTES } from "../../../constants/Api_Routes";

interface NeedsAttentionCardProps {
  items?: NeedsAttentionItem[];
  loading?: boolean;
}

export const NeedsAttentionCard: React.FC<NeedsAttentionCardProps> = ({
  items = [],
  loading = false,
}) => {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200/90 p-5 shadow-xs animate-pulse space-y-4">
        <div className="w-40 h-4 rounded bg-gray-100" />
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-50 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const getReasonConfig = (item: NeedsAttentionItem) => {
    switch (item.reason) {
      case "near_limit":
        return {
          icon: AlertTriangle,
          badge: "Limit Warning",
          badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
          iconColor: "text-amber-500",
        };
      case "expired_subscription":
        return {
          icon: ShieldBan,
          badge: "Suspended",
          badgeClass: "bg-rose-50 text-rose-700 border-rose-200",
          iconColor: "text-rose-500",
        };
      case "inactive_30d":
      default:
        return {
          icon: Clock,
          badge: "Inactive",
          badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
          iconColor: "text-blue-500",
        };
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200/90 p-5 shadow-xs flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <h2 className="text-sm font-bold text-gray-900 tracking-tight">
              Needs Attention
            </h2>
          </div>
          <span className="text-[11px] font-semibold text-gray-400">
            {items.length} {items.length === 1 ? "issue" : "issues"} flagged
          </span>
        </div>

        <p className="text-xs text-gray-500 mt-2 mb-3">
          Organizations requiring review due to capacity thresholds, status, or dormancy
        </p>

        {items.length === 0 ? (
          <div className="py-10 flex flex-col items-center justify-center text-center">
            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center mb-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <p className="text-xs font-semibold text-gray-800">
              All Organizations Operational
            </p>
            <p className="text-[11px] text-gray-400 mt-0.5">
              No plan overages, expired subscriptions, or dormant accounts detected.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
            {items.slice(0, 6).map((item) => {
              const cfg = getReasonConfig(item);
              const Icon = cfg.icon;

              return (
                <Link
                  key={`${item.id}-${item.reason}`}
                  to={API_ROUTES.SUPER_ADMIN.NAV.ORGANIZATIONS}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-gray-100 hover:border-gray-200 hover:bg-gray-50/70 transition-all group text-xs"
                >
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <div className="p-2 rounded-lg bg-gray-50 group-hover:bg-white transition-colors flex-shrink-0">
                      <Icon className={`w-3.5 h-3.5 ${cfg.iconColor}`} />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900 truncate group-hover:text-indigo-600 transition-colors">
                          {item.name}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full border ${cfg.badgeClass}`}
                        >
                          {cfg.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 truncate mt-0.5">
                        {item.details}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[11px] font-mono font-medium text-gray-600">
                      {item.metric}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-500 transition-colors" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {items.length > 6 && (
        <div className="pt-3 border-t border-gray-100 mt-3 text-right">
          <Link
            to={API_ROUTES.SUPER_ADMIN.NAV.ORGANIZATIONS}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1"
          >
            <span>View all {items.length} organizations</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      )}
    </div>
  );
};
