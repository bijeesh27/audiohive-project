import React, { useState, useMemo } from "react";
import { BarChart3 } from "lucide-react";
import type { ActivityChartPoint } from "../../../services/workspaceAdminServices";

interface ActivityChartProps {
  data?: ActivityChartPoint[];
  loading?: boolean;
}

export const ActivityChart: React.FC<ActivityChartProps> = ({ data = [], loading = false }) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const maxVal = useMemo(() => {
    if (!data || data.length === 0) return 10;
    const peak = Math.max(...data.map((d) => Math.max(d.actions || 0, d.logins || 0)));
    return peak > 0 ? Math.ceil(peak * 1.15) : 10;
  }, [data]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200/90 p-5 shadow-xs h-80 flex flex-col justify-between animate-pulse">
        <div className="flex justify-between items-center pb-4 border-b border-gray-100">
          <div className="w-32 h-4 rounded bg-gray-100" />
          <div className="w-24 h-4 rounded bg-gray-100" />
        </div>
        <div className="h-56 bg-gray-50/70 rounded-xl" />
      </div>
    );
  }

  const isEmpty = !data || data.length === 0 || data.every((d) => d.actions === 0 && d.logins === 0);

  const height = 240;
  const width = 640;
  const paddingLeft = 40;
  const paddingRight = 20;
  const paddingTop = 24;
  const paddingBottom = 32;

  const chartW = width - paddingLeft - paddingRight;
  const chartH = height - paddingTop - paddingBottom;

  const getX = (idx: number) => {
    if (data.length <= 1) return paddingLeft + chartW / 2;
    return paddingLeft + (idx / (data.length - 1)) * chartW;
  };

  const getY = (val: number) => {
    return paddingTop + chartH - (val / maxVal) * chartH;
  };

  const pointsActions = data.map((d, i) => `${getX(i)},${getY(d.actions)}`).join(" ");
  const areaActions = data.length > 0
    ? `${getX(0)},${paddingTop + chartH} ` +
      pointsActions +
      ` ${getX(data.length - 1)},${paddingTop + chartH}`
    : "";

  const pointsLogins = data.map((d, i) => `${getX(i)},${getY(d.logins)}`).join(" ");

  return (
    <div className="bg-white rounded-xl border border-gray-200/90 p-5 shadow-xs flex flex-col justify-between">
      {/* Chart Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100 gap-2">
        <div>
          <h2 className="text-sm font-bold text-gray-900 tracking-tight">Activity & Logins</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Total member actions vs authentication logins in selected period
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs font-medium">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 shadow-xs" />
            <span className="text-gray-700">Total Actions</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-xs" />
            <span className="text-gray-700">Logins</span>
          </div>
        </div>
      </div>

      {isEmpty ? (
        <div className="h-60 flex flex-col items-center justify-center text-gray-400">
          <div className="p-3 rounded-full bg-gray-50 mb-2">
            <BarChart3 className="w-6 h-6 text-gray-300" />
          </div>
          <p className="text-xs font-medium text-gray-600">No activity recorded for this period</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Events and logins will appear here when members interact.</p>
        </div>
      ) : (
        <div className="relative pt-3 select-none">
          {/* Hover Tooltip Box */}
          {hoverIndex !== null && data[hoverIndex] && (
            <div
              className="absolute top-1 right-2 bg-gray-900/95 text-white text-[11px] rounded-xl px-3 py-1.5 shadow-lg flex items-center gap-3.5 z-20 backdrop-blur-xs transition-opacity duration-150"
            >
              <span className="font-semibold text-gray-200">{data[hoverIndex].label}</span>
              <div className="flex items-center gap-1 text-indigo-300">
                <span className="w-2 h-2 rounded-full bg-indigo-400" />
                <span>Actions: <strong className="text-white">{data[hoverIndex].actions}</strong></span>
              </div>
              <div className="flex items-center gap-1 text-amber-300">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>Logins: <strong className="text-white">{data[hoverIndex].logins}</strong></span>
              </div>
            </div>
          )}

          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
            <defs>
              <linearGradient id="actionsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4F46E5" stopOpacity="0.22" />
                <stop offset="100%" stopColor="#4F46E5" stopOpacity="0.01" />
              </linearGradient>
            </defs>

            {/* Grid lines and Y-axis labels */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
              const y = paddingTop + chartH * (1 - ratio);
              const labelVal = Math.round(maxVal * ratio);
              return (
                <g key={i}>
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
                    fontSize="10"
                    fill="#94a3b8"
                    className="tabular-nums font-mono"
                  >
                    {labelVal}
                  </text>
                </g>
              );
            })}

            {/* Area Fill for Actions */}
            <polygon points={areaActions} fill="url(#actionsGradient)" />

            {/* Line for Actions */}
            <polyline
              fill="none"
              stroke="#4F46E5"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={pointsActions}
            />

            {/* Line for Logins */}
            <polyline
              fill="none"
              stroke="#F59E0B"
              strokeWidth="2"
              strokeDasharray="4 4"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={pointsLogins}
            />

            {/* Interactive hover columns and point circles */}
            {data.map((d, i) => {
              const cx = getX(i);
              const cyActions = getY(d.actions);
              const cyLogins = getY(d.logins);
              const isHovered = hoverIndex === i;

              // Step for X labels to prevent crowding
              const showLabel =
                data.length <= 10 ||
                i === 0 ||
                i === data.length - 1 ||
                i % Math.ceil(data.length / 6) === 0;

              return (
                <g
                  key={i}
                  className="cursor-pointer"
                  onMouseEnter={() => setHoverIndex(i)}
                  onMouseLeave={() => setHoverIndex(null)}
                >
                  {/* Invisible broad column for hover detection */}
                  <rect
                    x={cx - chartW / (data.length * 2)}
                    y={paddingTop}
                    width={chartW / data.length}
                    height={chartH}
                    fill="transparent"
                  />

                  {/* Vertical dashed guide when hovered */}
                  {isHovered && (
                    <line
                      x1={cx}
                      y1={paddingTop}
                      x2={cx}
                      y2={paddingTop + chartH}
                      stroke="#cbd5e1"
                      strokeWidth="1"
                      strokeDasharray="2 2"
                    />
                  )}

                  {/* Action point dot */}
                  <circle
                    cx={cx}
                    cy={cyActions}
                    r={isHovered ? 4.5 : 3}
                    fill="#ffffff"
                    stroke="#4F46E5"
                    strokeWidth="2"
                  />

                  {/* Login point dot */}
                  <circle
                    cx={cx}
                    cy={cyLogins}
                    r={isHovered ? 4.5 : 2.5}
                    fill="#ffffff"
                    stroke="#F59E0B"
                    strokeWidth="2"
                  />

                  {/* X Axis Date Label */}
                  {showLabel && (
                    <text
                      x={cx}
                      y={paddingTop + chartH + 18}
                      textAnchor="middle"
                      fontSize="10"
                      fill={isHovered ? "#1e293b" : "#94a3b8"}
                      fontWeight={isHovered ? "bold" : "normal"}
                    >
                      {d.label}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      )}
    </div>
  );
};

