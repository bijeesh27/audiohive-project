import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

export default function SuperAdminLayout() {
  return (
    <div className="flex h-screen bg-[#F8FAFC] antialiased text-gray-900">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-[1400px] w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
