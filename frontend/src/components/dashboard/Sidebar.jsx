import React from "react";
import {
  Home, Briefcase, Users, BarChart3, Plus, UserCog, Settings, LogOut,
} from "lucide-react";

function NavItem({ icon, label, active, collapsed, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center ${
        collapsed ? "justify-center" : "justify-start"
      } gap-3 px-3 py-2 rounded-md text-sm transition ${
        active ? "bg-white text-[#173B8A] font-semibold" : "hover:bg-white/10 text-white"
      }`}
      title={label}
      type="button"
    >
      <span className="shrink-0">{icon}</span>
      {!collapsed && <span className="whitespace-nowrap">{label}</span>}
    </button>
  );
}

export default function Sidebar({ collapsed, onPostJob, onLogout, onNav, active = "Dashboard" }) {
  const asideWidth = collapsed ? "w-16" : "w-64";

  return (
    <aside className={`${asideWidth} bg-[#173B8A] text-white hidden md:flex flex-col transition-[width] duration-200`}>
      {/* Brand row */}
      <div className={`h-16 border-b border-white/10 ${collapsed ? "grid place-items-center px-0" : "flex items-end px-6"}`}>
        <div className={`flex items-center gap-3 ${collapsed ? "" : "pb-3"}`}>
          <div className="w-8 h-8 rounded-md bg-[#F37526]" />
          {!collapsed && <div className="font-semibold leading-none">InternConnect</div>}
        </div>
      </div>

      {!collapsed && <div className="p-4 text-xs uppercase tracking-wide text-white/70">Navigation</div>}
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
          label="Job Postings"
          active={active === "Job Postings"}
          collapsed={collapsed}
          onClick={() => onNav?.("Job Postings")}
        />
        <NavItem
          icon={<Users className="w-4 h-4" />}
          label="Applications"
          active={active === "Applications"}
          collapsed={collapsed}
          onClick={() => onNav?.("Applications")}
        />
        <NavItem
          icon={<BarChart3 className="w-4 h-4" />}
          label="Analytics"
          active={active === "Analytics"}
          collapsed={collapsed}
          onClick={() => onNav?.("Analytics")}
        />
      </nav>

      {!collapsed && <div className="p-4 text-xs uppercase tracking-wide text-white/70 mt-4">Quick Actions</div>}
      <nav className="px-2 flex flex-col gap-1">
        <NavItem
          icon={<Plus className="w-4 h-4" />}
          label="Post New Job"
          collapsed={collapsed}
          onClick={onPostJob}
        />
      </nav>

      {!collapsed && <div className="p-4 text-xs uppercase tracking-wide text-white/70 mt-4">Organization</div>}
      <nav className="px-2 flex flex-col gap-1">
        <NavItem
          icon={<UserCog className="w-4 h-4" />}
          label="Employees"
          active={active === "Employees"}
          collapsed={collapsed}
          onClick={() => onNav?.("Employees")}
        />
        <NavItem
          icon={<Settings className="w-4 h-4" />}
          label="Setting"
          active={active === "Setting"}
          collapsed={collapsed}
          onClick={() => onNav?.("Setting")}
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
