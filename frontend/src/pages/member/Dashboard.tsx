import Logout from "../../components/common/Logout";

const Dashboard = () => {
  return (
    <div className="min-h-screen w-full bg-slate-50 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-medium text-slate-800">Welcome, Member</h1>
        <Logout />
      </div>
    </div>
  );
};

export default Dashboard;
