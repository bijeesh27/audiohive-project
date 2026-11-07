import { useEffect, useState } from "react";
import { DoorOpen, Users, TrendingUp, ArrowRight, Activity } from "lucide-react";
import { Link } from "react-router-dom";
import { getWorkspaceDashboardStats } from "../../services/workspaceAdminServices";
import { useAuth } from "../../context/AuthContext";
import { API_ROUTES } from "../../constants/Api_Routes";

export default function Dashboard() {
  const { username } = useAuth();
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
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
          <p className="text-xs text-gray-500 mt-1">Overview of your workspace operations and active members.</p>
        </div>

        <Link
          to={API_ROUTES.WORKSPACE_ADMIN.NAV.USER_ANALYTICS}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
        >
          <TrendingUp className="w-3.5 h-3.5" />
          User Analytics
          <ArrowRight className="w-3 h-3 ml-0.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs flex items-center gap-4">
          <div className="bg-blue-50 p-3 rounded-xl">
            <DoorOpen className="text-blue-600 w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Rooms</p>
            <p className="text-2xl font-bold text-gray-900 mt-0.5">{stats.totalRooms}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs flex items-center gap-4">
          <div className="bg-purple-50 p-3 rounded-xl">
            <Users className="text-purple-600 w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Members</p>
            <p className="text-2xl font-bold text-gray-900 mt-0.5">{stats.totalUsers}</p>
          </div>
        </div>

        <Link
          to={API_ROUTES.WORKSPACE_ADMIN.NAV.USER_ANALYTICS}
          className="bg-indigo-50/70 border border-indigo-100 hover:border-indigo-200 p-5 rounded-xl shadow-xs flex items-center justify-between group transition-all"
        >
          <div className="flex items-center gap-3.5">
            <div className="bg-indigo-600 text-white p-3 rounded-xl shadow-xs">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-indigo-900">User Activity Analytics</p>
              <p className="text-[11px] text-indigo-600 mt-0.5">Track member logins & time</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-indigo-500 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-7 shadow-xs">
        <div className="max-w-3xl">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Welcome back, {username || "there"}!</h2>
          <p className="text-gray-500 text-xs leading-relaxed">
            This is your workspace administration hub. Monitor user engagement, schedule meetings,
            manage audio/video rooms, and track real-time member activities. Access detailed insights
            anytime via the User Activity Analytics dashboard.
          </p>
        </div>
      </div>
    </div>
  );
}
