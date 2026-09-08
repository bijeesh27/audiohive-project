import { useEffect, useState } from "react";
import { Building2, Users } from "lucide-react";
import { getSuperAdminDashboardStats } from "../../services/superAdminServices";

export default function Dashboard() {
  const [stats, setStats] = useState({ totalOrganizations: 0, totalUsers: 0 });

  useEffect(() => {
    getSuperAdminDashboardStats()
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
          <div className="bg-indigo-50 p-3 rounded-lg">
            <Building2 className="text-indigo-600 w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Organizations</p>
            <p className="text-2xl font-bold text-gray-900">{stats.totalOrganizations}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm flex items-center gap-4">
          <div className="bg-violet-50 p-3 rounded-lg">
            <Users className="text-violet-600 w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Users</p>
            <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
        <div className="max-w-3xl">
          <h2 className="text-xl font-medium text-gray-800 mb-3">Welcome back, Super Admin!</h2>
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