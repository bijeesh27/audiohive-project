export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
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