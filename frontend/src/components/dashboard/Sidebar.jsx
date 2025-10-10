import React from "react";
import {
  Home,
  Briefcase,
  Users,
  BarChart3,
  Plus,
  UserCog,
  Settings,
  LogOut,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

function NavItem({ icon, label, to, collapsed }) {
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ Active state rules:
  // - Dashboard (/company) must match EXACTLY
  // - Other items are active on exact match OR nested paths (startsWith)
  const isDashboard = to === "/company";
  const isActive = isDashboard
    ? location.pathname === "/company"
    : location.pathname === to || location.pathname.startsWith(`${to}/`);

  return (
    <button
      onClick={() => navigate(to)}
      className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-150 ${
        collapsed ? "justify-center" : "justify-start"
      } ${
        isActive
          ? "bg-white text-[#173B8A] shadow-sm"
          : "text-white/90 hover:bg-white/10 hover:text-white"
      }`}
      title={label}
      type="button"
    >
      <span className="shrink-0">{icon}</span>
      {!collapsed && <span className="whitespace-nowrap">{label}</span>}
    </button>
  );
}

export default function Sidebar({ collapsed, onLogout }) {
  const asideWidth = collapsed ? "w-16" : "w-64";

  return (
    <aside
      className={`${asideWidth} bg-[#173B8A] text-white hidden md:flex flex-col transition-[width] duration-200`}
    >
      {/* Brand row */}
      <div
        className={`h-16 border-b border-white/10 ${
          collapsed ? "grid place-items-center px-0" : "flex items-end px-6"
        }`}
      >
        <div className={`flex items-center gap-3 ${collapsed ? "" : "pb-3"}`}>
          <div className="w-8 h-8 rounded-md bg-[#F37526]" />
          {!collapsed && (
            <div className="font-semibold leading-none">InternConnect</div>
          )}
        </div>
      </div>

      {!collapsed && (
        <div className="p-4 text-xs uppercase tracking-wide text-white/70">
          Navigation
        </div>
      )}

      <nav className="px-2 flex flex-col gap-1">
        <NavItem
          icon={<Home className="w-4 h-4" />}
          label="Dashboard"
          to="/company"
          collapsed={collapsed}
        />
        <NavItem
          icon={<Briefcase className="w-4 h-4" />}
          label="Job Postings"
          to="/company/postings"
          collapsed={collapsed}
        />
        <NavItem
          icon={<Users className="w-4 h-4" />}
          label="Applications"
          to="/company/applications"
          collapsed={collapsed}
        />
        <NavItem
          icon={<BarChart3 className="w-4 h-4" />}
          label="Analytics"
          to="/company/analytics"
          collapsed={collapsed}
        />
      </nav>

      {!collapsed && (
        <div className="p-4 text-xs uppercase tracking-wide text-white/70 mt-4">
          Quick Actions
        </div>
      )}

      <nav className="px-2 flex flex-col gap-1">
        <NavItem
          icon={<Plus className="w-4 h-4" />}
          label="Post New Job"
          to="/company/post-job"
          collapsed={collapsed}
        />
      </nav>

      {!collapsed && (
        <div className="p-4 text-xs uppercase tracking-wide text-white/70 mt-4">
          Organization
        </div>
      )}

      <nav className="px-2 flex flex-col gap-1">
        <NavItem
          icon={<UserCog className="w-4 h-4" />}
          label="Employees"
          to="/company/employees"
          collapsed={collapsed}
        />
        <NavItem
          icon={<Settings className="w-4 h-4" />}
          label="Setting"
          to="/company/setting"
          collapsed={collapsed}
        />
      </nav>

      <div className="mt-auto p-2">
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-white/10 hover:bg-white/20 transition"
          title="Logout"
          type="button"
        >
          <LogOut className="w-4 h-4" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
