// src/components/studentDashboard/StudentSidebar.jsx
import React from "react";
import {
  Home,
  Briefcase,
  FileText,
  User,
  Settings as SettingsIcon,
  LogOut,
  Lock,
  Shield,
  ArrowLeft,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

function NavItem({ icon, label, to, collapsed }) {
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ Improved active logic
  const isDashboard = to === "/student";
  const isActive = isDashboard
    ? location.pathname === "/student" // exact match only
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

export default function StudentSidebar({
  collapsed,
  onLogout,
}) {
  const asideWidth = collapsed ? "w-16" : "w-64";
  const location = useLocation();
  const navigate = useNavigate();

  // ✅ Detect when user is in /student/settings/*
  const isSettings =
    location.pathname === "/student/settings" ||
    location.pathname.startsWith("/student/settings/");

  return (
    <aside
      className={`${asideWidth} bg-[#173B8A] text-white hidden md:flex flex-col transition-[width] duration-200`}
    >
      {/* ─────── Brand Logo ─────── */}
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

      {/* ───────── Default Nav (Main Pages) ───────── */}
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
              to="/student"
              collapsed={collapsed}
            />
            <NavItem
              icon={<Briefcase className="w-4 h-4" />}
              label="Browse Jobs"
              to="/student/browse-jobs"
              collapsed={collapsed}
            />
            <NavItem
              icon={<FileText className="w-4 h-4" />}
              label="My Applications"
              to="/student/my-applications"
              collapsed={collapsed}
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
              to="/student/profile"
              collapsed={collapsed}
            />
            <NavItem
              icon={<SettingsIcon className="w-4 h-4" />}
              label="Settings"
              to="/student/settings"
              collapsed={collapsed}
            />
          </nav>
        </>
      )}

      {/* ───────── Settings Menu ───────── */}
      {isSettings && (
        <>
          <div className="px-2 pt-3">
            <button
              type="button"
              onClick={() => navigate("/student")}
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
                <span className="text-sm font-semibold">Back to Dashboard</span>
              )}
            </button>
          </div>

          {!collapsed && (
            <div className="px-4 mt-4">
              <div className="text-[15px] uppercase font-semibold">
                Account Center
              </div>
              <div className="text-[11px] text-white/70 mt-1">
                Manage your Account settings
              </div>
            </div>
          )}

          <nav className="px-2 mt-2 flex flex-col gap-1">
            <NavItem
              icon={<Lock className="w-4 h-4" />}
              label="Password and Security"
              to="/student/settings/password"
              collapsed={collapsed}
            />
            <NavItem
              icon={<User className="w-4 h-4" />}
              label="Profile details"
              to="/student/settings/profile"
              collapsed={collapsed}
            />
          </nav>

          {!collapsed && (
            <div className="px-4 mt-5">
              <div className="text-[15px] uppercase font-semibold">
                Community Standards and Legal Policies
              </div>
            </div>
          )}

          <nav className="px-2 mt-2 flex flex-col gap-1">
            <NavItem
              icon={<FileText className="w-4 h-4" />}
              label="Terms of Service"
              to="/student/settings/terms"
              collapsed={collapsed}
            />
            <NavItem
              icon={<Shield className="w-4 h-4" />}
              label="Privacy policy"
              to="/student/settings/privacy"
              collapsed={collapsed}
            />
          </nav>
        </>
      )}

      {/* ───────── Logout Button ───────── */}
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
