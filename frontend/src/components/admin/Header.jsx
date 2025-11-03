import React, { useState, useEffect, useRef } from "react";
import { Bell, PanelLeft, CheckCircle, X, Loader2 } from "lucide-react";

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
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openPopover, setOpenPopover] = useState(false);
  const popoverRef = useRef(null);

  // Fetch notifications for popover
  const fetchNotifications = async (showSpinner = true) => {
    const token = localStorage.getItem("ic_token");
    if (!token) return;

    try {
      if (showSpinner) setLoading(true);
      const res = await fetch(`${import.meta.env.VITE_API_BASE || "http://localhost:5000"}/api/admin/users/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch notifications");
      const data = await res.json();
      setNotifications(data.notifications || []);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  // Mark notification as read
  const markAsRead = async (id) => {
    try {
      const token = localStorage.getItem("ic_token");
      const res = await fetch(`${import.meta.env.VITE_API_BASE || "http://localhost:5000"}/api/admin/users/notifications/${id}/read`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to mark as read");
      // Update local state
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  // Fetch unread count
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

  useEffect(() => {
    fetchUnreadCount();
    // Refresh every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close popover on outside click
  useEffect(() => {
    if (!openPopover) return;
    const handleClickOutside = (event) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setOpenPopover(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openPopover]);

  // Fetch notifications when popover opens
  useEffect(() => {
    if (openPopover) {
      fetchNotifications();
    }
  }, [openPopover]);

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
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpenPopover(!openPopover)}
              className="relative w-10 h-10 grid place-items-center rounded-full bg-white/10 hover:bg-white/15 transition cursor-pointer"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Popover */}
            {openPopover && (
              <div
                ref={popoverRef}
                className="absolute right-0 top-12 w-96 max-h-[70vh] bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50"
              >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-1 border-b bg-gray-50">
                  <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                  <button
                    onClick={() => setOpenPopover(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Content */}
                <div className="relative">
                  {loading ? (
                    <div className="p-4 flex justify-center">
                      <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p>No notifications</p>
                    </div>
                  ) : (
                    <div className="p-3 max-h-[60vh] overflow-y-auto grid gap-3">
                      {notifications.map((notification) => (
                        <div
                          key={notification._id}
                          className={`relative rounded-xl border shadow-sm hover:shadow-md transition hover:-translate-y-0.5 p-3 break-words
                            ${!notification.isRead ? "bg-orange-50" : "bg-gray-100"}`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-gray-900 text-sm">
                                {notification.title}
                              </h4>
                              <p className="text-gray-700 text-sm mt-1">
                                {notification.data?.companyName || notification.message}
                              </p>
                              <p className="text-xs text-gray-500 mt-2">
                                {new Date(notification.createdAt).toLocaleString()}
                              </p>
                              <div className="flex gap-2 mt-2">
                                {!notification.isRead && (
                                  <button
                                    onClick={() => markAsRead(notification._id)}
                                    className="text-xs text-blue-600 hover:text-blue-800"
                                  >
                                    Mark as read
                                  </button>
                                )}
                                <button
                                  onClick={() => window.location.assign('/admin/company-applications')}
                                  className="text-xs text-orange-600 hover:text-orange-800"
                                >
                                  View Company
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
                  <span className="text-sm text-gray-600">
                    {unreadCount} unread
                  </span>
                  <button
                    onClick={onNotificationsClick}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    View all →
                  </button>
                </div>
              </div>
            )}
          </div>

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
