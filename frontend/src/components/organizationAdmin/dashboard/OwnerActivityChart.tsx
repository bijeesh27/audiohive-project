import React, { useState, useMemo } from "react";
import { BarChart3 } from "lucide-react";
import type { OwnerActivityPoint } from "../../../services/organizationServices";

interface OwnerActivityChartProps {
  data?: OwnerActivityPoint[];
  loading?: boolean;
}

export const OwnerActivityChart: React.FC<OwnerActivityChartProps> = ({
  data = [],
  loading = false,
}) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  // Peak activity (left axis)
  const maxActivities = useMemo(() => {
    if (!data || data.length === 0) return 10;
    const peak = Math.max(...data.map((d) => d.activities || 0));
    return peak > 0 ? Math.ceil(peak * 1.2) : 10;
  }, [data]);

  // Peak meetings (right axis - independent scale so meetings are readable)
  const maxMeetings = useMemo(() => {
    if (!data || data.length === 0) return 5;
    const peak = Math.max(...data.map((d) => d.meetings || 0));
    return peak > 0 ? Math.ceil(peak * 1.2) : 5;
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

  const isEmpty = !data || data.length === 0 || data.every((d) => d.activities === 0 && d.meetings === 0);

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

  const getYActivities = (val: number) => {
    return paddingTop + chartH - (val / maxActivities) * chartH;
  };

  const getYMeetings = (val: number) => {
    return paddingTop + chartH - (val / maxMeetings) * chartH;
  };

  const pointsActivities = data.map((d, i) => `${getX(i)},${getYActivities(d.activities)}`).join(" ");
  const areaActivities = data.length > 0
    ? `${getX(0)},${paddingTop + chartH} ` +
      pointsActivities +
      ` ${getX(data.length - 1)},${paddingTop + chartH}`
    : "";

  const pointsMeetings = data.map((d, i) => `${getX(i)},${getYMeetings(d.meetings)}`).join(" ");

  return (
    <div className="bg-white rounded-xl border border-gray-200/90 p-5 shadow-xs flex flex-col justify-between">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100 gap-2">
        <div>
          <h2 className="text-sm font-bold text-gray-900 tracking-tight">Organization Activity & Meetings</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Dual-axis trend: Member actions (left axis) vs Conducted meetings (right axis)
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
          <p className="text-xs font-medium text-gray-600">No activity recorded for this period</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Actions and meetings across workspaces will appear here.</p>
        </div>
      ) : (
        <div className="relative pt-3 select-none">
          {/* Tooltip Box */}
          {hoverIndex !== null && data[hoverIndex] && (
            <div
              className="absolute top-1 right-2 bg-gray-900/95 text-white text-[11px] rounded-xl px-3 py-1.5 shadow-lg flex items-center gap-3.5 z-20 backdrop-blur-xs transition-opacity duration-150"
            >
              <span className="font-semibold text-gray-200">{data[hoverIndex].label}</span>
              <span className="flex items-center gap-1 font-mono text-indigo-300">
                <span className="w-2 h-2 rounded-full bg-indigo-400 inline-block" />
                {data[hoverIndex].activities} actions
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
                <linearGradient id="ownerChartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity="0.22" />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Horizontal Grid lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
                const y = paddingTop + chartH * (1 - pct);
                const actVal = Math.round(maxActivities * pct);
                const meetVal = Math.round(maxMeetings * pct);
                return (
                  <g key={pct}>
                    <line
                      x1={paddingLeft}
                      y1={y}
                      x2={width - paddingRight}
                      y2={y}
                      stroke="#f1f5f9"
                      strokeDasharray="4 4"
                    />
                    {/* Left Axis: Activities */}
                    <text
                      x={paddingLeft - 8}
                      y={y + 3}
                      textAnchor="end"
                      className="text-[10px] fill-gray-400 font-mono"
                    >
                      {actVal}
                    </text>
                    {/* Right Axis: Meetings */}
                    <text
                      x={width - paddingRight + 8}
                      y={y + 3}
                      textAnchor="start"
                      className="text-[10px] fill-amber-500 font-mono font-medium"
                    >
                      {meetVal}
                    </text>
                  </g>
                );
              })}

              {/* Area for Activities */}
              <polygon points={areaActivities} fill="url(#ownerChartGradient)" />

              {/* Line for Activities */}
              <polyline
                fill="none"
                stroke="#6366f1"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={pointsActivities}
              />

              {/* Line for Meetings */}
              <polyline
                fill="none"
                stroke="#f59e0b"
                strokeWidth="2"
                strokeDasharray="4 2"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={pointsMeetings}
              />

              {/* Hover guide & point circles */}
              {data.map((d, i) => {
                const x = getX(i);
                const yAct = getYActivities(d.activities);
                const yMeet = getYMeetings(d.meetings);
                const isHovered = hoverIndex === i;

                return (
                  <g key={i}>
                    {/* Invisible hover trigger */}
                    <rect
                      x={x - (chartW / (data.length * 2 || 1))}
                      y={paddingTop}
                      width={chartW / (data.length || 1)}
                      height={chartH}
                      fill="transparent"
                      className="cursor-pointer"
                      onMouseEnter={() => setHoverIndex(i)}
                    />

                    {isHovered && (
                      <line
                        x1={x}
                        y1={paddingTop}
                        x2={x}
                        y2={paddingTop + chartH}
                        stroke="#94a3b8"
                        strokeDasharray="3 3"
                        strokeWidth="1.5"
                      />
                    )}

                    {/* Activity Point */}
                    <circle
                      cx={x}
                      cy={yAct}
                      r={isHovered ? 5 : 3}
                      fill="#6366f1"
                      stroke="#ffffff"
                      strokeWidth="2"
                      className="transition-all duration-100"
                    />

                    {/* Meeting Point */}
                    <circle
                      cx={x}
                      cy={yMeet}
                      r={isHovered ? 4.5 : 2.5}
                      fill="#f59e0b"
                      stroke="#ffffff"
                      strokeWidth="1.5"
                      className="transition-all duration-100"
                    />

                    {/* X-axis unclipped label */}
                    <text
                      x={x}
                      y={height - 8}
                      textAnchor="middle"
                      className={`text-[10px] transition-colors ${
                        isHovered ? "fill-gray-900 font-bold" : "fill-gray-400 font-medium"
                      }`}
                    >
                      {d.label}
                    </text>
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
