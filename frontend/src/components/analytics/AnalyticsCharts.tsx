import React, { useState } from "react";
import { BarChart3, Inbox } from "lucide-react";
import type { LucideIcon } from "lucide-react";

// ── Metric Card ────────────────────────────────────────────────────────────
interface MetricCardProps {
  title: string;
  value: number | string;
  subtext?: string;
  icon: LucideIcon;
  iconBgColor?: string;
  iconColor?: string;
  badge?: {
    text: string;
    variant: "success" | "warning" | "info" | "neutral" | "danger";
  };
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtext,
  icon: Icon,
  iconBgColor = "bg-indigo-50",
  iconColor = "text-indigo-600",
  badge,
}) => {
  const badgeStyles = {
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
    info: "bg-blue-50 text-blue-700 border-blue-200",
    neutral: "bg-gray-100 text-gray-700 border-gray-200",
    danger: "bg-rose-50 text-rose-700 border-rose-200",
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200/90 p-5 shadow-xs hover:border-gray-300 transition-all">
      <div className="flex items-start justify-between">
        <div className={`p-2.5 rounded-xl ${iconBgColor}`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        {badge && (
          <span
            className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
              badgeStyles[badge.variant]
            }`}
          >
            {badge.text}
          </span>
        )}
      </div>

      <div className="mt-4">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1 tracking-tight">{value}</p>
        {subtext && <p className="text-xs text-gray-500 mt-1">{subtext}</p>}
      </div>
    </div>
  );
};

// ── Trend Area Chart (SVG) ─────────────────────────────────────────────────
export interface ChartDataPoint {
  label: string;
  val1: number; // primary metric (e.g. activities)
  val2?: number; // secondary metric (e.g. meetings or logins)
}

interface TrendAreaChartProps {
  data: ChartDataPoint[];
  title: string;
  subtitle?: string;
  metric1Name?: string;
  metric2Name?: string;
  metric1Color?: string;
  metric2Color?: string;
  height?: number;
}

export const TrendAreaChart: React.FC<TrendAreaChartProps> = ({
  data,
  title,
  subtitle,
  metric1Name = "Activities",
  metric2Name = "Meetings",
  metric1Color = "#6366f1", // indigo
  metric2Color = "#10b981", // emerald
  height = 220,
}) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col items-center justify-center h-64 text-gray-400">
        <BarChart3 className="w-8 h-8 opacity-40 mb-2" />
        <p className="text-xs">No activity trends available for this date range.</p>
      </div>
    );
  }

  const maxVal = Math.max(
    ...data.map((d) => Math.max(d.val1, d.val2 ?? 0)),
    5
  );

  const paddingLeft = 36;
  const paddingRight = 16;
  const paddingTop = 20;
  const paddingBottom = 30;
  const width = 600;

  const chartW = width - paddingLeft - paddingRight;
  const chartH = height - paddingTop - paddingBottom;

  const getX = (idx: number) => {
    if (data.length <= 1) return paddingLeft + chartW / 2;
    return paddingLeft + (idx / (data.length - 1)) * chartW;
  };

  const getY = (val: number) => {
    return paddingTop + chartH - (val / maxVal) * chartH;
  };

  // Build points string for polyline & path
  const points1 = data.map((d, i) => `${getX(i)},${getY(d.val1)}`).join(" ");
  const areaPoints1 = `${getX(0)},${paddingTop + chartH} ` +
    points1 +
    ` ${getX(data.length - 1)},${paddingTop + chartH}`;

  const hasMetric2 = data.some((d) => d.val2 !== undefined);
  const points2 = hasMetric2
    ? data.map((d, i) => `${getX(i)},${getY(d.val2 ?? 0)}`).join(" ")
    : "";

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100 gap-2">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
          {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs font-medium">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: metric1Color }} />
            <span className="text-gray-600">{metric1Name}</span>
          </div>
          {hasMetric2 && (
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: metric2Color }} />
              <span className="text-gray-600">{metric2Name}</span>
            </div>
          )}
        </div>
      </div>

      <div className="relative pt-4">
        {/* Tooltip info */}
        {hoverIndex !== null && data[hoverIndex] && (
          <div className="absolute top-2 right-2 bg-gray-900 text-white text-[11px] rounded-lg px-2.5 py-1.5 shadow-md flex items-center gap-3 z-10">
            <span className="font-semibold">{data[hoverIndex].label}:</span>
            <span>
              {metric1Name}: {data[hoverIndex].val1}
            </span>
            {hasMetric2 && data[hoverIndex].val2 !== undefined && (
              <span>
                {metric2Name}: {data[hoverIndex].val2}
              </span>
            )}
          </div>
        )}

        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
          <defs>
            <linearGradient id="metric1Gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={metric1Color} stopOpacity="0.25" />
              <stop offset="100%" stopColor={metric1Color} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
            const y = paddingTop + chartH * (1 - ratio);
            const valLabel = Math.round(maxVal * ratio);
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
                  y={y + 3}
                  textAnchor="end"
                  fontSize="10"
                  fill="#94a3b8"
                >
                  {valLabel}
                </text>
              </g>
            );
          })}

          {/* Area under Metric 1 */}
          <polygon points={areaPoints1} fill="url(#metric1Gradient)" />

          {/* Metric 1 Line */}
          <polyline
            fill="none"
            stroke={metric1Color}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={points1}
          />

          {/* Metric 2 Line */}
          {hasMetric2 && (
            <polyline
              fill="none"
              stroke={metric2Color}
              strokeWidth="2"
              strokeDasharray="4 4"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={points2}
            />
          )}

          {/* Hover target columns & points */}
          {data.map((d, i) => {
            const cx = getX(i);
            const cy1 = getY(d.val1);
            const isHovered = hoverIndex === i;

            return (
              <g
                key={i}
                className="cursor-pointer"
                onMouseEnter={() => setHoverIndex(i)}
                onMouseLeave={() => setHoverIndex(null)}
              >
                {/* Invisible wide column for hover target */}
                <rect
                  x={cx - chartW / (data.length * 2)}
                  y={paddingTop}
                  width={chartW / data.length}
                  height={chartH}
                  fill="transparent"
                />

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

                {/* Point for Metric 1 */}
                <circle
                  cx={cx}
                  cy={cy1}
                  r={isHovered ? 5 : 3.5}
                  fill="#ffffff"
                  stroke={metric1Color}
                  strokeWidth="2"
                  className="transition-all"
                />

                {/* X axis labels (show subset if many) */}
                {(data.length <= 10 || i % Math.ceil(data.length / 7) === 0 || i === data.length - 1) && (
                  <text
                    x={cx}
                    y={paddingTop + chartH + 18}
                    textAnchor="middle"
                    fontSize="10"
                    fill={isHovered ? "#0f172a" : "#94a3b8"}
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
    </div>
  );
};

// ── Distribution Donut Chart (SVG) ──────────────────────────────────────────
export interface DonutItem {
  id: string;
  name: string;
  value: number;
  percentage: number;
  color: string;
}

interface DistributionDonutChartProps {
  items: DonutItem[];
  title: string;
  subtitle?: string;
  centerNumber: number | string;
  centerLabel: string;
}

export const DistributionDonutChart: React.FC<DistributionDonutChartProps> = ({
  items,
  title,
  subtitle,
  centerNumber,
  centerLabel,
}) => {
  const size = 160;
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const total = items.reduce((sum, item) => sum + item.value, 0);

  let accumulatedPercent = 0;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs flex flex-col justify-between">
      <div className="border-b border-gray-100 pb-3 mb-4">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-around gap-6 my-auto">
        {/* SVG Donut */}
        <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
            {/* Background circle */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="#f1f5f9"
              strokeWidth={strokeWidth}
              fill="none"
            />

            {/* Slices */}
            {total > 0 &&
              items.map((item) => {
                const strokeDasharray = `${(item.percentage / 100) * circumference} ${circumference}`;
                const strokeDashoffset = -((accumulatedPercent / 100) * circumference);
                accumulatedPercent += item.percentage;

                return (
                  <circle
                    key={item.id}
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={item.color}
                    strokeWidth={strokeWidth}
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    fill="none"
                    className="transition-all duration-300"
                  />
                );
              })}
          </svg>

          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-xl font-bold text-gray-900 tracking-tight leading-none">
              {centerNumber}
            </span>
            <span className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider font-medium">
              {centerLabel}
            </span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex-1 w-full space-y-2 max-h-44 overflow-y-auto pr-1">
          {items.map((item) => (
            <div key={item.id} className="flex items-center justify-between text-xs gap-2">
              <div className="flex items-center gap-2 truncate">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-gray-700 font-medium truncate" title={item.name}>
                  {item.name}
                </span>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <span className="text-gray-900 font-semibold">{item.value}</span>
                <span className="text-gray-400 text-[10px]">({item.percentage}%)</span>
              </div>
            </div>
          ))}

          {items.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-4">No data to display</p>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Horizontal Bar Chart ───────────────────────────────────────────────────
export interface BarItem {
  id: string;
  name: string;
  value: number;
  subValue?: string;
  badge?: string;
  color?: string;
}

interface HorizontalBarChartProps {
  items: BarItem[];
  title: string;
  subtitle?: string;
  valueSuffix?: string;
}

export const HorizontalBarChart: React.FC<HorizontalBarChartProps> = ({
  items,
  title,
  subtitle,
  valueSuffix = "",
}) => {
  const max = Math.max(...items.map((i) => i.value), 1);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs">
      <div className="border-b border-gray-100 pb-3 mb-4">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
      </div>

      <div className="space-y-3.5">
        {items.map((item, idx) => {
          const percent = Math.min(100, Math.round((item.value / max) * 100));
          return (
            <div key={item.id} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 truncate">
                  <span className="text-gray-400 font-semibold text-[11px] w-4">
                    #{idx + 1}
                  </span>
                  <span className="text-gray-800 font-medium truncate">{item.name}</span>
                  {item.badge && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-gray-100 text-gray-600 font-medium capitalize">
                      {item.badge}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900">
                    {item.value} {valueSuffix}
                  </span>
                  {item.subValue && <span className="text-gray-400 text-[10px]">({item.subValue})</span>}
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${percent}%`,
                    backgroundColor: item.color || "#6366f1",
                  }}
                />
              </div>
            </div>
          );
        })}

        {items.length === 0 && (
          <div className="py-6 text-center text-gray-400 text-xs">
            <Inbox className="w-6 h-6 mx-auto mb-1 opacity-40" />
            No records found.
          </div>
        )}
      </div>
    </div>
  );
};
