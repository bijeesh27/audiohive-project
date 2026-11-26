import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import { OrganizationProvider } from "../../../context/OrganizationContext";

export default function OrganizationLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <OrganizationProvider>
      <div className="flex h-dvh bg-[#F8FAFC] antialiased text-gray-900">
        <Sidebar />

        {mobileMenuOpen && (
          <div
            className="fixed inset-0 z-40 bg-gray-900/40 backdrop-blur-xs md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          >
            <div
              className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <Sidebar mobile={true} onClose={() => setMobileMenuOpen(false)} />
            </div>
          </div>
        )}

        <div className="flex flex-col flex-1 overflow-hidden min-w-0">
          <Navbar onOpenMobileMenu={() => setMobileMenuOpen(true)} />
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-[1280px] w-full">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </OrganizationProvider>
  );
}
