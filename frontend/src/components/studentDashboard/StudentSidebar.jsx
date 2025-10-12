// src/components/studentDashboard/StudentSidebar.jsx
import React from "react";
import {
  Home,
  Briefcase,
  FileText,
  User,
  Settings as SettingsIcon,
  LogOut,
  // settings icons
  Lock,
  Shield,
  ArrowLeft,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

function NavItem({ icon, label, active, collapsed, onClick, to }) {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive =
    typeof to === "string"
      ? location.pathname === to || location.pathname.startsWith(`${to}/`)
      : !!active;

  const handleClick = () => {
    if (to) navigate(to);
    else if (onClick) onClick();
  };

  return (
    <button
      onClick={handleClick}
      className={`flex items-center ${
        collapsed ? "justify-center" : "justify-start"
      } gap-3 px-3 py-2 rounded-md text-sm transition ${
        isActive
          ? "bg-white text-[#173B8A] font-semibold shadow-sm"
          : "hover:bg-white/10 text-white"
      }`}
      title={label}
      type="button"
    >
      <span className="shrink-0">{icon}</span>
      {!collapsed && <span className="whitespace-nowrap">{label}</span>}
    </button>
  );
}

/**
 * StudentSidebar
 * - Default mode: shows student dashboard nav (uses onNav to keep your current in-page tabs)
 * - Settings mode: auto when path is /student/settings/* (routes to nested settings tabs)
 */
export default function StudentSidebar({
  collapsed,
  active = "Dashboard",
  onLogout,
  onNav,
  // base paths (customizable if you ever change routes)
  settingsTo = "/student/settings",
  backTo = "/student",
}) {
  const asideWidth = collapsed ? "w-16" : "w-64";
  const location = useLocation();
  const navigate = useNavigate();

  // Auto enter settings menu when under /student/settings/*
  const isSettings =
    location.pathname === settingsTo ||
    location.pathname.startsWith(`${settingsTo}/`);

  return (
    <aside
      className={`${asideWidth} bg-[#173B8A] text-white hidden md:flex flex-col transition-[width] duration-200`}
    >
      {/* Brand */}
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

      {/* ───────── Default Student Nav ───────── */}
      {!isSettings && (
        <>
          {!collapsed && (
            <div className="p-4 text-xs uppercase tracking-wide text-white/70">
              Navigation
            </div>
          )}

          <nav className="px-2 flex flex-col gap-1">
            <NavItem
              icon={<Home className="w-4 h-4" />}
              label="Dashboard"
              active={active === "Dashboard"}
              collapsed={collapsed}
              onClick={() => onNav?.("Dashboard")}
            />
            <NavItem
              icon={<Briefcase className="w-4 h-4" />}
              label="Browse Jobs"
              active={active === "Browse Jobs"}
              collapsed={collapsed}
              onClick={() => onNav?.("Browse Jobs")}
            />
            <NavItem
              icon={<FileText className="w-4 h-4" />}
              label="My Applications"
              active={active === "My Applications"}
              collapsed={collapsed}
              onClick={() => onNav?.("My Applications")}
            />
          </nav>

          {!collapsed && (
            <div className="p-4 text-xs uppercase tracking-wide text-white/70 mt-4">
              Account
            </div>
          )}

          <nav className="px-2 flex flex-col gap-1">
            <NavItem
              icon={<User className="w-4 h-4" />}
              label="Profile"
              active={active === "Profile"}
              collapsed={collapsed}
              onClick={() => onNav?.("Profile")}
            />
            {/* Route to StudentSettings */}
            <NavItem
              icon={<SettingsIcon className="w-4 h-4" />}
              label="Settings"
              collapsed={collapsed}
              to={settingsTo}
            />
          </nav>
        </>
      )}

      {/* ───────── Settings Nav (auto on /student/settings/*) ───────── */}
      {isSettings && (
        <>
          {/* Header pill (like your design) */}
          <div className="px-2 pt-3">
            <button
              type="button"
              onClick={() => navigate(backTo)}
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
              {!collapsed && (
                <span className="text-sm font-semibold">Settings</span>
              )}
            </button>
          </div>

          {/* Account Center */}
          {!collapsed && (
            <div className="px-4 mt-4">
              <div className="text-[13px] font-semibold">Account Center</div>
              <div className="text-[11px] text-white/70 mt-1">
                Manage your Account settings
              </div>
            </div>
          )}

          <nav className="px-2 mt-2 flex flex-col gap-1">
            <NavItem
              icon={<Lock className="w-4 h-4" />}
              label="Password and Security"
              collapsed={collapsed}
              to={`${settingsTo}/password`}
            />
            <NavItem
              icon={<User className="w-4 h-4" />}
              label="Profile details"
              collapsed={collapsed}
              to={`${settingsTo}/profile`}
            />
          </nav>

          {/* Legal */}
          {!collapsed && (
            <div className="px-4 mt-5">
              <div className="text-[13px] font-semibold">
                Community Standards and legal policies
              </div>
            </div>
          )}

          <nav className="px-2 mt-2 flex flex-col gap-1">
            <NavItem
              icon={<FileText className="w-4 h-4" />}
              label="Terms of Service"
              collapsed={collapsed}
              to={`${settingsTo}/terms`}
            />
            <NavItem
              icon={<Shield className="w-4 h-4" />}
              label="Privacy policy"
              collapsed={collapsed}
              to={`${settingsTo}/privacy`}
            />
          </nav>
        </>
      )}

      {/* Logout */}
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
