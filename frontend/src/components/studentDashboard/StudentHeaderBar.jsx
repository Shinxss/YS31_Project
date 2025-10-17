// src/components/studentDashboard/StudentHeaderBar.jsx
import React from "react";
import { Bell, PanelLeft } from "lucide-react";
import { useLocation } from "react-router-dom";

function getInitials(name) {
  return name
    .trim()
    .split(/\s+/)
    .map((n) => n[0]?.toUpperCase() || "")
    .slice(0, 2)
    .join("");
}

export default function StudentHeaderBar({
  student = { firstName: "", lastName: "", course: "", profilePicture: "" },
  onToggleSidebar,
}) {
  const location = useLocation();

  // ✅ Dynamically compute title based on path
  const computeTitle = () => {
    if (location.pathname === "/student") return "Dashboard";
    if (location.pathname.startsWith("/student/browse-jobs")) return "Browse Jobs";
    if (location.pathname.startsWith("/student/my-applications")) return "My Applications";
    if (location.pathname.startsWith("/student/profile")) return "Profile";
    if (location.pathname.startsWith("/student/settings")) return "Settings";
    return "InternConnect";
  };

  const title = computeTitle();
  const fullName = `${student.firstName || ""} ${student.lastName || ""}`.trim();

  return (
    <header className="h-16 bg-[#173B8A] text-white flex items-center justify-between px-4 md:px-6 ml-1 shadow-sm">
      {/* Left Section: Sidebar Toggle + Title */}
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
        <div className="text-xl font-bold leading-none">{title}</div>
      </div>

      {/* Right Section: Notification + Profile */}
      <div className="flex items-center gap-6">
        <button
          className="relative hover:opacity-90"
          title="Notifications"
          type="button"
        >
          <Bell className="w-5 h-5" />
        </button>

        {/* Avatar + Student Info */}
        <div className="flex items-center gap-3 min-w-0">
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

          <div className="leading-tight text-left min-w-0 hidden sm:block">
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
