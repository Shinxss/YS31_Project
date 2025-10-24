// frontend/src/components/dashboard/Sidebar.jsx
import React from "react";
import logoUrl from "@/assets/ic_logo.svg";
import {
  Home,
  Briefcase,
  Users,
  BarChart3,
  Plus,
  UserCog,
  Settings as SettingsIcon,
  LogOut,
  Lock,
  Building2,
  User,
  FileText,
  Shield,
  ArrowLeft,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

function NavItem({ icon, label, to, collapsed }) {
  const navigate = useNavigate();
  const location = useLocation();

  const isDashboard = to === "/company";
  const isActive = isDashboard
    ? location.pathname === "/company"
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

export default function Sidebar({ collapsed, onLogout }) {
  const asideWidth = collapsed ? "w-16" : "w-64";
  const location = useLocation();
  const navigate = useNavigate();

  const isSettings =
    location.pathname === "/company/settings" ||
    location.pathname.startsWith("/company/settings/");

  return (
    <aside className={`${asideWidth} bg-[#173B8A] text-white hidden md:flex flex-col h-screen overflow-hidden transition-[width] duration-200`}>
      {/* Brand row (fixed) */}
      <div
        className={`h-16 border-b border-white/10 shrink-0 sticky top-0 z-10 bg-[#173B8A] ${
          collapsed ? "grid place-items-center px-0" : "flex items-end px-6"
        }`}
      >
        <div className={`flex items-center gap-3 ${collapsed ? "" : "pb-4"}`}>
          <img
            src={logoUrl}
            alt="InternConnect logo"
            className="w-8 h-8 rounded-md shrink-0"
            draggable="false"
          />
          {!collapsed && <div className="font-bold text-xl leading-none">InternConnect</div>}
        </div>
      </div>

      {/* Scrollable nav content */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {/* DASHBOARD NAV (default) */}
        {!isSettings && (
          <>
            {!collapsed && (
              <div className="p-4 text-xs uppercase tracking-wide text-white/70">Navigation</div>
            )}

            <nav className="px-2 flex flex-col gap-1">
              <NavItem icon={<Home className="w-4 h-4" />} label="Dashboard" to="/company" collapsed={collapsed} />
              <NavItem icon={<Briefcase className="w-4 h-4" />} label="Job Postings" to="/company/postings" collapsed={collapsed} />
              <NavItem icon={<Users className="w-4 h-4" />} label="Applications" to="/company/applications" collapsed={collapsed} />
              <NavItem icon={<BarChart3 className="w-4 h-4" />} label="Analytics" to="/company/analytics" collapsed={collapsed} />
            </nav>

            {!collapsed && (
              <div className="p-4 text-xs uppercase tracking-wide text-white/70 mt-4">Quick Actions</div>
            )}

            <nav className="px-2 flex flex-col gap-1">
              <NavItem icon={<Plus className="w-4 h-4" />} label="Post New Job" to="/company/post-job" collapsed={collapsed} />
            </nav>

            {!collapsed && (
              <div className="p-4 text-xs uppercase tracking-wide text-white/70 mt-4">Organization</div>
            )}

            <nav className="px-2 flex flex-col gap-1">
              <NavItem icon={<SettingsIcon className="w-4 h-4" />} label="Settings" to="/company/settings" collapsed={collapsed} />
            </nav>
          </>
        )}

        {/* SETTINGS NAV */}
        {isSettings && (
          <>
            <div className="px-2 pt-3">
              <button
                type="button"
                onClick={() => navigate("/company")}
                className={`w-full ${
                  collapsed ? "h-10" : "h-12"
                } rounded-xl bg-white/10 hover:bg-white/15 transition flex items-center ${
                  collapsed ? "justify-center" : "justify-start px-3"
                }`}
                title="Back to Dashboard"
              >
                <span className="grid place-items-center w-8 h-8 rounded-lg bg-white/10 mr-3">
                  <ArrowLeft className="w-4 h-4" />
                </span>
                {!collapsed && <span className="text-sm font-semibold">Back to Dashboard</span>}
              </button>
            </div>

            {!collapsed && (
              <div className="px-4 mt-4">
                <div className="text-[15px] uppercase font-semibold">ACCOUNT CENTER</div>
                <div className="text-[11px] text-white/70 mt-1">Manage your Account settings</div>
              </div>
            )}

            <nav className="px-2 mt-2 flex flex-col gap-1">
              <NavItem icon={<Lock className="w-4 h-4" />} label="Password and Security" to="/company/settings/password" collapsed={collapsed} />
              <NavItem icon={<Building2 className="w-4 h-4" />} label="Company details" to="/company/settings/company" collapsed={collapsed} />
              <NavItem icon={<User className="w-4 h-4" />} label="Profile details" to="/company/settings/profile" collapsed={collapsed} />
            </nav>

            {!collapsed && (
              <div className="px-4 mt-5">
                <div className="text-[15px] uppercase font-semibold">
                  COMMUNITY STANDARDS AND LEGAL POLICIES
                </div>
              </div>
            )}

            <nav className="px-2 mt-2 flex flex-col gap-1">
              <NavItem icon={<FileText className="w-4 h-4" />} label="Terms of Service" to="/company/settings/terms" collapsed={collapsed} />
              <NavItem icon={<Shield className="w-4 h-4" />} label="Privacy policy" to="/company/settings/privacy" collapsed={collapsed} />
            </nav>
          </>
        )}
      </div>

      {/* Logout (fixed at bottom) */}
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
