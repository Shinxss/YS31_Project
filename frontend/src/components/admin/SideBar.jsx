import React from "react";
import logoUrl from "@/assets/ic_logo.svg";
import {
  LayoutDashboard as Home,
  Briefcase,
  Users,
  BarChart3,
  LogOut,
  Settings as SettingsIcon,
  Lock,
  Building2,
  User,
  FileText,
  Shield,
  ArrowLeft,
  Bell,
  Database,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

const base = "/admin/dashboard"; // ✅ single source of truth

function NavItem({ icon, label, to, collapsed }) {
  const navigate = useNavigate();
  const location = useLocation();

  const isDashboard = to === base;
  const isActive = isDashboard
    ? location.pathname === base
    : location.pathname === to || location.pathname.startsWith(`${to}/`);

  return (
    <button
      onClick={() => navigate(to)}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
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

export default function AdminSidebar({ collapsed, onLogout }) {
  const asideWidth = collapsed ? "w-16" : "w-64";
  const location = useLocation();
  const navigate = useNavigate();

  const isSettings =
    location.pathname === `${base}/settings` ||
    location.pathname.startsWith(`${base}/settings/`);

  return (
    <aside
      className={`${asideWidth} bg-[#173B8A] text-white hidden md:flex flex-col h-screen overflow-hidden transition-[width] duration-200`}
    >
      {/* Brand row */}
      <div
        className={`h-16 border-b border-white/10 shrink-0 sticky top-0 z-10 bg-[#173B8A] ${
          collapsed ? "grid place-items-center px-0" : "flex items-end px-6"
        }`}
      >
        <div className={`flex items-center gap-3 ${collapsed ? "" : "pb-4"}`}>
          <img src={logoUrl} alt="InternConnect logo" className="w-8 h-8 rounded-md shrink-0" />
          {!collapsed && <div className="font-bold text-xl leading-none">InternConnect</div>}
        </div>
      </div>

      {/* Scrollable nav */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {/* Default nav */}
        {!isSettings && (
          <>
            {!collapsed && (
              <div className="p-4 text-xs uppercase tracking-wide text-white/70">Navigation</div>
            )}

            <nav className="px-2 flex flex-col gap-1">
              <NavItem icon={<Home className="w-4 h-4" />} label="Dashboard" to={`${base}`} collapsed={collapsed} />
              <NavItem icon={<Users className="w-4 h-4" />} label="User Management" to={`${base}/users`} collapsed={collapsed} />
              <NavItem icon={<Briefcase className="w-4 h-4" />} label="Company Applications" to={`${base}/company-applications`} collapsed={collapsed} />
              <NavItem icon={<FileText className="w-4 h-4" />} label="Job Listings Review" to={`${base}/job-listings`} collapsed={collapsed} />
              <NavItem icon={<Bell className="w-4 h-4" />} label="Notifications" to={`${base}/notifications`} collapsed={collapsed} />
              <NavItem icon={<Database className="w-4 h-4" />} label="Data Export" to={`${base}/data-export`} collapsed={collapsed} />
            </nav>
          </>
        )}
      </div>

      {/* Logout */}
      <div className="mt-auto p-2 shrink-0">
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
