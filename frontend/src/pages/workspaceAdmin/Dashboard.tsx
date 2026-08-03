import { Link } from "react-router-dom";
import { API_ROUTES } from "../../constants/Api_Routes";
import Logout from "../../components/common/Logout";

const Dashboard = () => {
  return (
    <div className="min-h-screen w-full bg-slate-50 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Welcome, Workspace Admin
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Here's what's happening across your workspace.
            </p>
          </div>
          <Logout />
        </div>

        <div className="mt-8 bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-sm font-semibold text-slate-900">
            Quick actions
          </h2>
          <Link
            to={API_ROUTES.WORKSPACE_ADMIN.NAV.GET_USERS}
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:underline"
          >
            Get Users →
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
