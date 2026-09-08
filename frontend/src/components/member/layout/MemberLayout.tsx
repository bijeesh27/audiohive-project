import { Outlet } from "react-router-dom";
import MemberSidebar from "./Sidebar";
import MemberNavbar from "./Navbar";

export default function MemberLayout() {
  return (
    <div className="flex h-screen bg-[#F8FAFC]">
      <MemberSidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <MemberNavbar />
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
