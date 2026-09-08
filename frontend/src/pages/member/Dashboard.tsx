import { DoorOpen, Users } from "lucide-react";

const Dashboard = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
        <div className="max-w-3xl">
          <h2 className="text-xl font-medium text-gray-800 mb-3">Welcome, Member!</h2>
          <p className="text-gray-500 text-sm leading-relaxed">
            Welcome to AudioHive. Use the sidebar to navigate to your available rooms.
            You can access all public rooms and any private rooms you have been granted access to.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm flex items-center gap-4">
          <div className="bg-green-50 p-3 rounded-lg">
            <Users className="text-green-600 w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Role</p>
            <p className="text-sm font-medium text-gray-600 mt-0.5">Member</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
