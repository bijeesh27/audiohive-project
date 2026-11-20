import React from "react";
import { TrendingUp, BarChart3 } from "lucide-react";
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import type { GrowthDataPoint } from "../../../services/superAdminServices";

interface GrowthChartProps {
  data?: GrowthDataPoint[];
  loading?: boolean;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  label?: string;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;

  const users = payload.find((p) => p.name === "newUsers")?.value ?? 0;
  const orgs = payload.find((p) => p.name === "newOrganizations")?.value ?? 0;

  return (
    <div className="bg-gray-900/95 text-white text-[11px] rounded-xl px-3 py-1.5 shadow-lg flex items-center gap-3.5 backdrop-blur-xs border border-gray-800">
      <span className="font-semibold text-gray-200">{label}</span>
      <span className="flex items-center gap-1 font-mono text-violet-300">
        <span className="w-2 h-2 rounded-full bg-violet-400 inline-block" />
        {users} users
      </span>
      <span className="flex items-center gap-1 font-mono text-indigo-300">
        <span className="w-2 h-2 rounded-full bg-indigo-400 inline-block" />
        {orgs} orgs
      </span>
    </div>
  );
};

export const GrowthChart: React.FC<GrowthChartProps> = ({
  data = [],
  loading = false,
}) => {
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
        <div className="pt-3 h-64 w-full select-none">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={data}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="usersGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.01" />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />

              <XAxis
                dataKey="date"
                stroke="#94a3b8"
                fontSize={10}
                tickLine={false}
                axisLine={{ stroke: "#f1f5f9" }}
              />

              {/* Left YAxis: Users */}
              <YAxis
                yAxisId="left"
                stroke="#8b5cf6"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />

              {/* Right YAxis: Orgs */}
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#6366f1"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />

              <Tooltip content={<CustomTooltip />} />

              <Area
                yAxisId="left"
                type="monotone"
                dataKey="newUsers"
                name="newUsers"
                stroke="#8b5cf6"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#usersGradient)"
              />

              <Line
                yAxisId="right"
                type="monotone"
                dataKey="newOrganizations"
                name="newOrganizations"
                stroke="#6366f1"
                strokeWidth={2}
                dot={{ r: 2.5, fill: "#ffffff", stroke: "#6366f1", strokeWidth: 2 }}
                activeDot={{ r: 4.5, fill: "#ffffff", stroke: "#6366f1", strokeWidth: 2 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};
