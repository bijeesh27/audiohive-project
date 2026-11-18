import React, { useState, useMemo } from "react";
import { TrendingUp, BarChart3 } from "lucide-react";
import type { GrowthDataPoint } from "../../../services/superAdminServices";

interface GrowthChartProps {
  data?: GrowthDataPoint[];
  loading?: boolean;
}

export const GrowthChart: React.FC<GrowthChartProps> = ({
  data = [],
  loading = false,
}) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const maxUsers = useMemo(() => {
    if (!data || data.length === 0) return 5;
    const peak = Math.max(...data.map((d) => d.newUsers || 0));
    return peak > 0 ? Math.ceil(peak * 1.25) : 5;
  }, [data]);

  const maxOrgs = useMemo(() => {
    if (!data || data.length === 0) return 5;
    const peak = Math.max(...data.map((d) => d.newOrganizations || 0));
    return peak > 0 ? Math.ceil(peak * 1.25) : 5;
  }, [data]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200/90 p-5 shadow-xs h-80 flex flex-col justify-between animate-pulse">
        <div className="flex justify-between items-center pb-4 border-b border-gray-100">
          <div className="w-40 h-4 rounded bg-gray-100" />
          <div className="w-32 h-4 rounded bg-gray-100" />
        </div>
        <div className="h-56 bg-gray-50/70 rounded-xl" />
      </div>
    );
  }

  const isEmpty =
    !data ||
    data.length === 0 ||
    data.every((d) => d.newOrganizations === 0 && d.newUsers === 0);

  const height = 240;
  const width = 640;
  const paddingLeft = 40;
  const paddingRight = 40;
  const paddingTop = 28;
  const paddingBottom = 34;

  const chartW = width - paddingLeft - paddingRight;
  const chartH = height - paddingTop - paddingBottom;

  const getX = (idx: number) => {
    if (data.length <= 1) return paddingLeft + chartW / 2;
    return paddingLeft + (idx / (data.length - 1)) * chartW;
  };

  const getYUsers = (val: number) => {
    return paddingTop + chartH - (val / maxUsers) * chartH;
  };

  const getYOrgs = (val: number) => {
    return paddingTop + chartH - (val / maxOrgs) * chartH;
  };

  const pointsUsers = data
    .map((d, i) => `${getX(i)},${getYUsers(d.newUsers)}`)
    .join(" ");

  const areaUsers =
    data.length > 0
      ? `${getX(0)},${paddingTop + chartH} ` +
        pointsUsers +
        ` ${getX(data.length - 1)},${paddingTop + chartH}`
      : "";

  const pointsOrgs = data
    .map((d, i) => `${getX(i)},${getYOrgs(d.newOrganizations)}`)
    .join(" ");

  const areaOrgs =
    data.length > 0
      ? `${getX(0)},${paddingTop + chartH} ` +
        pointsOrgs +
        ` ${getX(data.length - 1)},${paddingTop + chartH}`
      : "";

  return (
    <div className="bg-white rounded-xl border border-gray-200/90 p-5 shadow-xs flex flex-col justify-between h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100 gap-2">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-bold text-gray-900 tracking-tight">
              Platform Growth
            </h2>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            New organizations and new user registrations per day over the range
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs font-medium">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-violet-600 shadow-xs" />
            <span className="text-gray-700">New Users</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-xs" />
            <span className="text-gray-700">New Orgs</span>
          </div>
        </div>
      </div>

      {isEmpty ? (
        <div className="h-60 flex flex-col items-center justify-center text-gray-400">
          <div className="p-3 rounded-full bg-gray-50 mb-2">
            <BarChart3 className="w-6 h-6 text-gray-300" />
          </div>
          <p className="text-xs font-medium text-gray-600">
            No new registrations in this period
          </p>
          <p className="text-[11px] text-gray-400 mt-0.5">
            New users and organizations created will appear here.
          </p>
        </div>
      ) : (
        <div className="relative pt-3 select-none">
          {/* Tooltip Box */}
          {hoverIndex !== null && data[hoverIndex] && (
            <div className="absolute top-1 right-2 bg-gray-900/95 text-white text-[11px] rounded-xl px-3 py-1.5 shadow-lg flex items-center gap-3.5 z-20 backdrop-blur-xs transition-opacity duration-150">
              <span className="font-semibold text-gray-200">
                {data[hoverIndex].date}
              </span>
              <span className="flex items-center gap-1 font-mono text-violet-300">
                <span className="w-2 h-2 rounded-full bg-violet-400 inline-block" />
                {data[hoverIndex].newUsers} users
              </span>
              <span className="flex items-center gap-1 font-mono text-indigo-300">
                <span className="w-2 h-2 rounded-full bg-indigo-400 inline-block" />
                {data[hoverIndex].newOrganizations} orgs
              </span>
            </div>
          )}

          {/* SVG Chart */}
          <div className="w-full overflow-hidden">
            <svg
              viewBox={`0 0 ${width} ${height}`}
              className="w-full h-56 overflow-visible"
              onMouseLeave={() => setHoverIndex(null)}
            >
              <defs>
                <linearGradient id="usersGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="orgsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
                const y = paddingTop + chartH * (1 - pct);
                return (
                  <g key={pct}>
                    <line
                      x1={paddingLeft}
                      y1={y}
                      x2={width - paddingRight}
                      y2={y}
                      stroke="#f1f5f9"
                      strokeWidth="1"
                    />
                    <text
                      x={paddingLeft - 8}
                      y={y + 3.5}
                      textAnchor="end"
                      fontSize="9"
                      fill="#94a3b8"
                      className="font-mono"
                    >
                      {Math.round(maxUsers * pct)}
                    </text>
                    <text
                      x={width - paddingRight + 8}
                      y={y + 3.5}
                      textAnchor="start"
                      fontSize="9"
                      fill="#94a3b8"
                      className="font-mono"
                    >
                      {Math.round(maxOrgs * pct)}
                    </text>
                  </g>
                );
              })}

              {/* Areas */}
              <polygon points={areaUsers} fill="url(#usersGradient)" />
              <polygon points={areaOrgs} fill="url(#orgsGradient)" />

              {/* Lines */}
              <polyline
                points={pointsUsers}
                fill="none"
                stroke="#8b5cf6"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <polyline
                points={pointsOrgs}
                fill="none"
                stroke="#6366f1"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Interactive Points and Hover Columns */}
              {data.map((d, i) => {
                const cx = getX(i);
                const cyUsers = getYUsers(d.newUsers);
                const cyOrgs = getYOrgs(d.newOrganizations);
                const isHovered = hoverIndex === i;

                return (
                  <g
                    key={i}
                    className="cursor-pointer"
                    onMouseEnter={() => setHoverIndex(i)}
                  >
                    {/* Hover vertical line */}
                    {isHovered && (
                      <line
                        x1={cx}
                        y1={paddingTop}
                        x2={cx}
                        y2={paddingTop + chartH}
                        stroke="#cbd5e1"
                        strokeWidth="1"
                        strokeDasharray="3 3"
                      />
                    )}

                    {/* Point for Users */}
                    <circle
                      cx={cx}
                      cy={cyUsers}
                      r={isHovered ? 5 : 3}
                      fill="#8b5cf6"
                      stroke="#ffffff"
                      strokeWidth="1.5"
                      className="transition-all"
                    />

                    {/* Point for Orgs */}
                    <circle
                      cx={cx}
                      cy={cyOrgs}
                      r={isHovered ? 5 : 3}
                      fill="#6366f1"
                      stroke="#ffffff"
                      strokeWidth="1.5"
                      className="transition-all"
                    />

                    {/* X-axis date labels */}
                    {(data.length <= 8 ||
                      i === 0 ||
                      i === data.length - 1 ||
                      i % Math.ceil(data.length / 5) === 0) && (
                      <text
                        x={cx}
                        y={height - 10}
                        textAnchor="middle"
                        fontSize="9"
                        fill="#64748b"
                        className="font-medium"
                      >
                        {d.date.slice(5)}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      )}
    </div>
  );
};
