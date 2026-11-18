import React from "react";
import { Link } from "react-router-dom";
import { CreditCard, ExternalLink } from "lucide-react";
import type { PlanDistributionItem } from "../../../services/superAdminServices";
import { API_ROUTES } from "../../../constants/Api_Routes";

interface PlanDistributionCardProps {
  distribution?: PlanDistributionItem[];
  loading?: boolean;
}

const PLAN_COLORS = [
  { bar: "bg-indigo-600", badge: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  { bar: "bg-violet-600", badge: "bg-violet-50 text-violet-700 border-violet-200" },
  { bar: "bg-emerald-600", badge: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { bar: "bg-amber-600", badge: "bg-amber-50 text-amber-700 border-amber-200" },
];

export const PlanDistributionCard: React.FC<PlanDistributionCardProps> = ({
  distribution = [],
  loading = false,
}) => {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200/90 p-5 shadow-xs animate-pulse space-y-4">
        <div className="w-32 h-4 rounded bg-gray-100" />
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-10 bg-gray-50 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const total = distribution.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="bg-white rounded-xl border border-gray-200/90 p-5 shadow-xs flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-bold text-gray-900 tracking-tight">
              Plan Distribution
            </h2>
          </div>
          <Link
            to={API_ROUTES.SUPER_ADMIN.NAV.SUBSCRIPTIONS}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 transition-colors"
          >
            <span>Manage Plans</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>

        <p className="text-xs text-gray-500 mt-2 mb-4">
          Organizations segmented across active platform billing tiers
        </p>

        {distribution.length === 0 ? (
          <div className="py-8 text-center text-xs text-gray-400">
            No active plan subscriptions found
          </div>
        ) : (
          <div className="space-y-3.5">
            {distribution.map((item, idx) => {
              const colors = PLAN_COLORS[idx % PLAN_COLORS.length];
              const pct = total > 0 ? Math.round((item.count / total) * 100) : 0;

              return (
                <Link
                  key={item.planId}
                  to={`${API_ROUTES.SUPER_ADMIN.NAV.SUBSCRIPTIONS}?plan=${encodeURIComponent(
                    item.planId
                  )}`}
                  className="block group p-2.5 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100"
                  title={`View subscriptions for ${item.planName}`}
                >
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                        {item.planName}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${colors.badge}`}
                      >
                        {item.price === 0 ? "Free" : `$${item.price}/mo`}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-gray-900">
                        {item.count} {item.count === 1 ? "org" : "orgs"}
                      </span>
                      <span className="text-[11px] text-gray-400 font-medium w-8 text-right">
                        {pct}%
                      </span>
                    </div>
                  </div>

                  {/* Horizontal Bar */}
                  <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${colors.bar} rounded-full transition-all duration-500 group-hover:opacity-90`}
                      style={{ width: `${Math.max(pct, 2)}%` }}
                    />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <div className="pt-4 border-t border-gray-100 mt-4 flex items-center justify-between text-[11px] text-gray-500">
        <span>Total Organizations</span>
        <span className="font-mono font-bold text-gray-900">{total}</span>
      </div>
    </div>
  );
};
