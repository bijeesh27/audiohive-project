import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  Users,
  CreditCard,
  Activity,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";
import { API_ROUTES } from "../../../constants/Api_Routes";

interface SidebarProps {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export default function Sidebar({
  isCollapsed: controlledCollapsed,
  onToggleCollapse,
}: SidebarProps) {
  const location = useLocation();

  const [internalCollapsed, setInternalCollapsed] = useState(() => {
    try {
      return localStorage.getItem("audiohive_superadmin_sidebar_collapsed") === "true";
    } catch {
      return false;
    }
  });

  const isCollapsed =
    controlledCollapsed !== undefined ? controlledCollapsed : internalCollapsed;

  const toggleCollapse = () => {
    if (onToggleCollapse) {
      onToggleCollapse();
    } else {
      const next = !internalCollapsed;
      setInternalCollapsed(next);
      try {
        localStorage.setItem("audiohive_superadmin_sidebar_collapsed", String(next));
      } catch {
        // ignore
      }
    }
  };

  // Strictly specified sidebar order:
  // Dashboard, Organizations, Users, Subscriptions, Activity Logs
  const navItems = [
    {
      name: "Dashboard",
      path: API_ROUTES.SUPER_ADMIN.NAV.DASHBOARD,
      icon: LayoutDashboard,
    },
    {
      name: "Organizations",
      path: API_ROUTES.SUPER_ADMIN.NAV.ORGANIZATIONS,
      icon: Building2,
    },
    {
      name: "Users",
      path: API_ROUTES.SUPER_ADMIN.NAV.GET_USERS,
      icon: Users,
    },
    {
      name: "Subscriptions",
      path: API_ROUTES.SUPER_ADMIN.NAV.SUBSCRIPTIONS,
      icon: CreditCard,
    },
    {
      name: "Activity Logs",
      path: API_ROUTES.SUPER_ADMIN.NAV.ACTIVITY_LOGS,
      icon: Activity,
    },
  ];

  return (
    <aside
      aria-label="Super Admin Navigation Sidebar"
      className={`${
        isCollapsed ? "w-20" : "w-64"
      } bg-white border-r border-gray-200 flex-shrink-0 hidden md:flex flex-col h-full transition-all duration-200 select-none z-30`}
    >
      {/* Brand & Super Admin Label Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-gray-100">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-700 flex items-center justify-center flex-shrink-0 shadow-xs">
            <span className="text-white font-bold text-sm tracking-wider">AH</span>
          </div>
          {!isCollapsed && (
            <div className="overflow-hidden">
              <span className="text-sm font-bold text-gray-900 block truncate">AudioHive</span>
              <div
                className="flex items-center gap-1 text-[11px] font-semibold text-indigo-700 truncate"
                title="Super Admin Portal"
              >
                <ShieldAlert className="w-3 h-3 text-indigo-600 flex-shrink-0" />
                <span className="truncate">Super Admin</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="px-3 space-y-1.5" aria-label="Super Admin Navigation">
          {navItems.map((item) => {
            const isActive =
              location.pathname.includes(item.path) ||
              (item.name === "Users" &&
                (location.pathname.includes("/superadmin/users") ||
                  location.pathname.includes("/superadmin/get-users")));
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                to={item.path}
                title={isCollapsed ? item.name : undefined}
                className={`relative flex items-center ${
                  isCollapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3 py-2.5"
                } rounded-xl text-xs font-medium transition-all group ${
                  isActive
                    ? "bg-indigo-50/80 text-indigo-900 font-semibold shadow-xs"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                {/* Active Accent Bar */}
                {isActive && (
                  <span
                    className="absolute left-0 top-2 bottom-2 w-1 bg-indigo-600 rounded-r-full"
                    aria-hidden="true"
                  />
                )}

                <Icon
                  className={`w-4 h-4 flex-shrink-0 transition-colors ${
                    isActive ? "text-indigo-600" : "text-gray-400 group-hover:text-gray-600"
                  }`}
                  aria-hidden="true"
                />

                {!isCollapsed && <span className="flex-1 truncate">{item.name}</span>}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Collapse Toggle Footer (No duplicate logout) */}
      <div className="p-3 border-t border-gray-100 flex items-center justify-between">
        <button
          type="button"
          onClick={toggleCollapse}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={`flex items-center ${
            isCollapsed ? "justify-center w-full" : "justify-between w-full px-2"
          } py-2 text-xs font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors`}
        >
          {!isCollapsed && <span className="text-[11px] text-gray-400">Collapse menu</span>}
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-gray-400" />
          )}
        </button>
      </div>
    </aside>
  );
}
