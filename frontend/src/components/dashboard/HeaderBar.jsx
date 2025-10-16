// frontend/src/components/dashboard/HeaderBar.jsx
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

export default function HeaderBar({
  companyName = "Company",
  person = { firstName: "", lastName: "", role: "" },
  onToggleSidebar,
}) {
  const fullName = `${person.firstName || ""} ${person.lastName || ""}`.trim();

  return (
    // tiny 2px gutter from the sidebar on the left
    <header className="h-16 bg-[#173B8A] text-white flex items-center justify-between px-4 md:px-6 ml-[2px]">
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
        <div className="text-xl font-bold leading-none">{companyName}</div>
      </div>

      <div className="flex items-center gap-6">
        <button className="relative hover:opacity-90" title="Notifications" type="button">
          <Bell className="w-5 h-5" />
        </button>

        {/* Avatar + name/role */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded bg-white/80 text-[#173B8A] font-semibold grid place-items-center shrink-0">
            {getInitials(fullName || companyName)}
          </div>

          {/* Make name & role left-aligned so role starts exactly under the name */}
          <div className="leading-tight text-left min-w-0">
            <div className="font-medium truncate">{fullName || "User"}</div>
            <div className="text-xs text-white/80">{person.role || "Member"}</div>
          </div>
        </div>
      </div>
    </header>
  );
}