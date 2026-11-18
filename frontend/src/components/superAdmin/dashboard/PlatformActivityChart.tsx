import React, { useState, useMemo } from "react";
import { Activity, BarChart3 } from "lucide-react";
import type { ActivityDataPoint } from "../../../services/superAdminServices";

interface PlatformActivityChartProps {
  data?: ActivityDataPoint[];
  loading?: boolean;
}

export const PlatformActivityChart: React.FC<PlatformActivityChartProps> = ({
  data = [],
  loading = false,
}) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  // Peak actions (left axis)
  const maxActions = useMemo(() => {
    if (!data || data.length === 0) return 10;
    const peak = Math.max(...data.map((d) => d.actions || 0));
    return peak > 0 ? Math.ceil(peak * 1.25) : 10;
  }, [data]);

  // Peak meetings (right axis - independent scale so small numbers stay clearly readable)
  const maxMeetings = useMemo(() => {
    if (!data || data.length === 0) return 5;
    const peak = Math.max(...data.map((d) => d.meetings || 0));
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
    data.every((d) => d.actions === 0 && d.meetings === 0);

  const height = 240;
  const width = 640;
  const paddingLeft = 45;
  const paddingRight = 45;
  const paddingTop = 28;
  const paddingBottom = 34;

  const chartW = width - paddingLeft - paddingRight;
  const chartH = height - paddingTop - paddingBottom;

  const getX = (idx: number) => {
    if (data.length <= 1) return paddingLeft + chartW / 2;
    return paddingLeft + (idx / (data.length - 1)) * chartW;
  };

  const getYActions = (val: number) => {
    return paddingTop + chartH - (val / maxActions) * chartH;
  };

  const getYMeetings = (val: number) => {
    return paddingTop + chartH - (val / maxMeetings) * chartH;
  };

  const pointsActions = data
    .map((d, i) => `${getX(i)},${getYActions(d.actions)}`)
    .join(" ");

  const areaActions =
    data.length > 0
      ? `${getX(0)},${paddingTop + chartH} ` +
        pointsActions +
        ` ${getX(data.length - 1)},${paddingTop + chartH}`
      : "";

  const pointsMeetings = data
    .map((d, i) => `${getX(i)},${getYMeetings(d.meetings)}`)
    .join(" ");

  return (
    <div className="bg-white rounded-xl border border-gray-200/90 p-5 shadow-xs flex flex-col justify-between h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100 gap-2">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-bold text-gray-900 tracking-tight">
              Platform Activity & Meetings
            </h2>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Total operations (left axis) vs Conducted meetings (right axis)
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs font-medium">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 shadow-xs" />
            <span className="text-gray-700">Actions</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-xs" />
            <span className="text-gray-700">Meetings</span>
          </div>
        </div>
      </div>

      {isEmpty ? (
        <div className="h-60 flex flex-col items-center justify-center text-gray-400">
          <div className="p-3 rounded-full bg-gray-50 mb-2">
            <BarChart3 className="w-6 h-6 text-gray-300" />
          </div>
          <p className="text-xs font-medium text-gray-600">
            No activity or meetings in this period
          </p>
          <p className="text-[11px] text-gray-400 mt-0.5">
            Audits and meetings across all organizations will chart here.
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
              <span className="flex items-center gap-1 font-mono text-indigo-300">
                <span className="w-2 h-2 rounded-full bg-indigo-400 inline-block" />
                {data[hoverIndex].actions} actions
              </span>
              <span className="flex items-center gap-1 font-mono text-amber-300">
                <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                {data[hoverIndex].meetings} meetings
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
                <linearGradient id="actionsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity="0.22" />
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
                      {Math.round(maxActions * pct)}
                    </text>
                    <text
                      x={width - paddingRight + 8}
                      y={y + 3.5}
                      textAnchor="start"
                      fontSize="9"
                      fill="#94a3b8"
                      className="font-mono"
                    >
                      {Math.round(maxMeetings * pct)}
                    </text>
                  </g>
                );
              })}

              {/* Actions Area & Line */}
              <polygon points={areaActions} fill="url(#actionsGradient)" />
              <polyline
                points={pointsActions}
                fill="none"
                stroke="#6366f1"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Meetings Line */}
              <polyline
                points={pointsMeetings}
                fill="none"
                stroke="#f59e0b"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Interactive Points and Hover Columns */}
              {data.map((d, i) => {
                const cx = getX(i);
                const cyActions = getYActions(d.actions);
                const cyMeetings = getYMeetings(d.meetings);
                const isHovered = hoverIndex === i;

                return (
                  <g
                    key={i}
                    className="cursor-pointer"
                    onMouseEnter={() => setHoverIndex(i)}
                  >
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

                    <circle
                      cx={cx}
                      cy={cyActions}
                      r={isHovered ? 5 : 3}
                      fill="#6366f1"
                      stroke="#ffffff"
                      strokeWidth="1.5"
                      className="transition-all"
                    />

                    <circle
                      cx={cx}
                      cy={cyMeetings}
                      r={isHovered ? 5 : 3}
                      fill="#f59e0b"
                      stroke="#ffffff"
                      strokeWidth="1.5"
                      className="transition-all"
                    />

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
