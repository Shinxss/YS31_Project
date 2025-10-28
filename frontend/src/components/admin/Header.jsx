import React, { useState, useEffect } from "react";
import { Bell, PanelLeft } from "lucide-react";

/** Initials avatar */
function Initials({ name = "", size = 32 }) {
  const parts = String(name).trim().split(/\s+/).slice(0, 2);
  const ini = parts.map(p => p[0]?.toUpperCase() || "").join("");
  return (
    <div
      className="grid place-items-center rounded-full bg-white/20 text-white font-semibold"
      style={{ width: size, height: size }}
      aria-hidden
    >
      {ini || "?"}
    </div>
  );
}

export default function Header({
  userName = "",
  userRole = "Admin",
  onToggleSidebar,
  onNotificationsClick,
}) {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Fetch unread notifications count
    const fetchUnreadCount = async () => {
      try {
        const token = localStorage.getItem("ic_token");
        if (!token) return;

        const res = await fetch(`${import.meta.env.VITE_API_BASE || "http://localhost:5000"}/api/admin/users/notifications`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          const unread = data.notifications.filter(n => !n.isRead).length;
          setUnreadCount(unread);
        }
      } catch (error) {
        console.error("Failed to fetch unread notifications:", error);
      }
    };

    fetchUnreadCount();
    // Refresh every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-30 h-16 bg-[#173B8A] text-white border-b border-white/10">
      <div className="h-full flex items-center justify-between px-4 md:px-6">
        {/* Left: toggle + title */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleSidebar}
            className="w-10 h-10 rounded-lg bg-white/10 hover:bg-white/15 active:bg-white/20 grid place-items-center transition"
            title="Toggle sidebar"
          >
            <PanelLeft className="w-5 h-5" />
          </button>
          <div className="text-lg md:text-xl font-semibold">Admin Dashboard</div>
        </div>

        {/* Right: notifications + user */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onNotificationsClick}
            className="relative w-10 h-10 grid place-items-center rounded-full bg-white/10 hover:bg-white/15 transition"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          <div className="flex items-center gap-3">
            <Initials name={userName} size={36} />
            <div className="hidden sm:block leading-tight">
              <div className="text-[13px] font-medium">{userName || "—"}</div>
              <div className="text-[11px] opacity-80">{userRole}</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
