// frontend/src/components/dashboard/Sidebar.jsx
import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import logoUrl from "@/assets/ic_logo.svg";
import {
  LayoutGrid,       // Dashboard
  Users,            // User Management
  ClipboardList,    // Company Applications
  FileText,         // Job Listing Review
  Download,         // Data Export
  Settings,         // Settings
  LogOut,           // Logout
} from "lucide-react";

/** Single nav item (pill active style) */
function NavItem({ to, icon, label }) {
  const navigate = useNavigate();
  const location = useLocation();

  const isDashboard = to === "/company";
  const isActive = isDashboard
    ? location.pathname === "/company"
    : location.pathname === to || location.pathname.startsWith(`${to}/`);

  return (
    <button
      type="button"
      onClick={() => navigate(to)}
      className={[
        "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition",
        "text-white/90 hover:text-white",
        isActive
          ? "bg-blue-600 text-white shadow-sm"
          : "hover:bg-white/10",
      ].join(" ")}
    >
      <span className="shrink-0 opacity-95">{icon}</span>
      <span className="text-[14px] leading-tight break-words whitespace-normal text-left">
        {label}
      </span>
    </button>
  );
}

export default function Sidebar({ onLogout }) {
  return (
    <aside
      className={[
        "hidden md:flex flex-col h-screen w-56", // compact width like screenshot
        "relative overflow-hidden",
        "bg-gradient-to-b from-[#173B8A] to-[#142c6a]", // deep blue gradient
        "text-white",
      ].join(" ")}
    >
      {/* Thin orange accent bar on the very left (like your image edge) */}
      <span className="pointer-events-none absolute left-0 top-0 h-full w-[2px] bg-orange-500/90" />

      {/* Brand */}
      <div className="h-16 px-4 flex items-center border-b border-white/10">
        <div className="flex items-center gap-3">
          {/* If you prefer the orange IC tile, replace the <img> with a small square */}
          <img
            src={logoUrl}
            alt="InternConnect"
            className="w-7 h-7 rounded-md object-contain bg-white/5"
            draggable="false"
          />
          <div className="font-semibold text-[15px] tracking-tight">
            InternConnect
          </div>
        </div>
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-2">
        <NavItem
          to="/company"
          icon={<LayoutGrid className="w-4 h-4" />}
          label="Dashboard"
        />
        <NavItem
          to="/company/users"
          icon={<Users className="w-4 h-4" />}
          label="User Management"
        />
        <NavItem
          to="/company/applications"
          icon={<ClipboardList className="w-4 h-4" />}
          label="Company Applications"
        />
        <NavItem
          to="/company/review"
          icon={<FileText className="w-4 h-4" />}
          label="Job Listing Review"
        />
        <NavItem
          to="/company/export"
          icon={<Download className="w-4 h-4" />}
          label="Data Export"
        />
        <NavItem
          to="/company/settings"
          icon={<Settings className="w-4 h-4" />}
          label="Settings"
        />
      </div>

      {/* Footer / Logout */}
      <div className="px-4 py-3 border-t border-white/10">
        <button onClick={onLogout} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10">
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
            </button>
      </div>
    </aside>
  );
}
