import { useEffect, useState } from "react";
import { DoorOpen, Users } from "lucide-react";
import { getWorkspaceDashboardStats } from "../../services/workspaceAdminServices";

export default function Dashboard() {
  const [stats, setStats] = useState({ totalRooms: 0, totalUsers: 0 });

  useEffect(() => {
    getWorkspaceDashboardStats()
      .then((res) => {
        if (res?.data) setStats(res.data);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm flex items-center gap-4">
          <div className="bg-blue-50 p-3 rounded-lg">
            <DoorOpen className="text-blue-600 w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Rooms</p>
            <p className="text-2xl font-bold text-gray-900">{stats.totalRooms}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm flex items-center gap-4">
          <div className="bg-purple-50 p-3 rounded-lg">
            <Users className="text-purple-600 w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Users</p>
            <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
        <div className="max-w-3xl">
          <h2 className="text-xl font-medium text-gray-800 mb-3">Welcome back, Workspace Admin!</h2>
          <p className="text-gray-500 text-sm leading-relaxed">
            This is your centralized dashboard to oversee and manage the AudioHive platform.
            From here, you will be able to monitor system health, manage users, workspaces,
            and handle platform subscriptions.
          </p>
        </div>
      </div>
    </div>
  );
}