import { Link } from "react-router-dom";
import { API_ROUTES } from "../../constants/Api_Routes";
import Logout from "../../components/common/Logout";

const Dashboard = () => {
  return (
    <div className="flex  min-h-screen w-full bg-slate-50 p-8" >
      
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-slate-900">
          Welcome, Superadmin
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Here's what's happening across your workspace.
        </p>

        <div className="mt-8 bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-sm font-semibold text-slate-900">
            Quick actions
          </h2>
          <Link
            to={API_ROUTES.SUPER_ADMIN.NAV.GET_USERS}
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:underline"
          >
            Get Users →
          </Link>
        </div>
      </div>
      <nav className=" flex  justify-center bg-blue-600 h-10 w-20 rounded-xl text-white pt-1.5 hover:bg-blue-800" >
        <Logout />
      </nav>
    </div>
  );
};

export default Dashboard;
