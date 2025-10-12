// src/components/studentDashboard/StudentHeaderBar.jsx
import React from "react";
import { Bell, PanelLeft } from "lucide-react";

function getInitials(name) {
  return name
    .trim()
    .split(/\s+/)
    .map((n) => n[0]?.toUpperCase() || "")
    .slice(0, 2)
    .join("");
}

export default function StudentHeaderBar({
  student = { firstName: "", lastName: "", course: "", profilePicture: "" }, // ✅ added profilePicture
  onToggleSidebar,
  title = "Dashboard", // ✅ NEW: dynamic title with default
}) {
  const fullName = `${student.firstName || ""} ${student.lastName || ""}`.trim();

  return (
    <header className="h-16 bg-[#173B8A] text-white flex items-center justify-between px-4 md:px-6 ml-1">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="w-8 h-8 rounded border border-white/30 grid place-items-center hover:bg-white/10 transition"
          title="Toggle sidebar"
          aria-label="Toggle sidebar"
          type="button"
        >
          <PanelLeft className="w-4 h-4" />
        </button>
        {/* ⬇️ was hardcoded 'Dashboard'; now uses prop */}
        <div className="text-xl font-bold leading-none">{title}</div>
      </div>

      <div className="flex items-center gap-6">
        <button
          className="relative hover:opacity-90"
          title="Notifications"
          type="button"
        >
          <Bell className="w-5 h-5" />
        </button>

        {/* Avatar + name/course */}
        <div className="flex items-center gap-3 min-w-0">
          {/* ✅ ADDED: Show uploaded profile picture if available */}
          {student?.profilePicture ? (
            <img
              src={student.profilePicture}
              alt="Profile"
              className="w-8 h-8 rounded-full object-cover border-2 border-white shrink-0"
            />
          ) : (
            <div className="w-8 h-8 rounded bg-white/80 text-[#173B8A] font-semibold grid place-items-center shrink-0">
              {getInitials(fullName || "User")}
            </div>
          )}
          {/* ✅ END added */}

          <div className="leading-tight text-left min-w-0">
            <div className="font-medium truncate">{fullName || "Student"}</div>
            <div className="text-xs text-white/80 truncate">
              {student.course || "No Course"}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
