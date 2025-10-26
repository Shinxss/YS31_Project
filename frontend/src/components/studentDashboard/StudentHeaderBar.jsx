// src/components/studentDashboard/StudentHeaderBar.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Bell, PanelLeft, CheckCircle2, Loader2 } from "lucide-react";

const API_BASE = (import.meta.env.VITE_API_BASE || "http://localhost:5000").replace(/\/+$/, "");

/* ----------- hard filters (student sees only decision updates) ----------- */
const PERM_TYPE = "status"; // notifications generated when employer changes status
const ALLOWED_STATUSES = new Set(["Accepted", "Rejected"]);

/* --------------- utils --------------- */
function getInitials(name) {
  return String(name || "")
    .trim()
    .split(/\s+/)
    .map((n) => n[0]?.toUpperCase() || "")
    .slice(0, 2)
    .join("") || "U";
}
function timeAgo(iso) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleString();
}
function Chip({ children, intent = "default" }) {
  const map = {
    default: "bg-gray-100 text-gray-700",
    success: "bg-green-100 text-green-700",
    warn: "bg-amber-100 text-amber-700",
    info: "bg-blue-100 text-blue-700",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${map[intent]}`}>
      {children}
    </span>
  );
}

/* --------------- Popover --------------- */
function StudentNotifPopover({ open, onClose }) {
  const panelRef = useRef(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const token = typeof window !== "undefined" ? localStorage.getItem("ic_token") : null;

  const unreadCount = items.filter((n) => !n?.isRead).length;

  // close on outside / ESC
  useEffect(() => {
    if (!open) return;
    const onClick = (e) => {
      if (!panelRef.current) return;
      if (!panelRef.current.contains(e.target)) onClose?.();
    };
    const onKey = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  async function fetchList({ spinner = true } = {}) {
    if (!open) return;
    spinner ? setLoading(true) : setRefreshing(true);
    try {
      // Hint backend with type=status and statuses filter; still hard-filter client-side.
      const url = `${API_BASE}/api/student/notifications?limit=10&page=1&type=${encodeURIComponent(
        PERM_TYPE
      )}&statuses=${encodeURIComponent("Accepted,Rejected")}`;

      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to load");

      const list = Array.isArray(data) ? data : data.notifications || [];

      // Defensive filter: only keep type=status AND status ∈ {Accepted, Rejected}
      const filtered = list.filter(
        (n) =>
          String(n?.type || "").toLowerCase() === PERM_TYPE &&
          ALLOWED_STATUSES.has(n?.status || n?.data?.status)
      );

      setItems(filtered);
    } catch (e) {
      console.warn("student notif load failed:", e.message);
      setItems([]);
    } finally {
      spinner ? setLoading(false) : setRefreshing(false);
    }
  }

  useEffect(() => {
    if (open) fetchList({ spinner: true });
  }, [open]); // eslint-disable-line

  // poll while open
  useEffect(() => {
    if (!open) return;
    const id = setInterval(() => fetchList({ spinner: false }), 30_000);
    return () => clearInterval(id);
  }, [open]); // eslint-disable-line

  async function markRead(id) {
    try {
      setItems((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
      const r = await fetch(`${API_BASE}/api/student/notifications/${id}/read`, {
        method: "PATCH",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!r.ok) throw new Error();
    } catch {
      setItems((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: false } : n)));
    }
  }

  async function markAllRead() {
    try {
      setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
      await fetch(`${API_BASE}/api/student/notifications/read-all`, {
        method: "PATCH",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
    } catch {
      fetchList({ spinner: false });
    }
  }

  if (!open) return null;

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-12 w-[360px] max-h-[70vh] bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-[60]"
    >
      {/* header */}
      <div className="flex items-center justify-between px-3 py-2 border-b bg-gray-50">
        <div className="text-sm font-semibold">Notifications</div>
        <button onClick={markAllRead} className="text-xs text-blue-700 hover:underline">
          Mark all as read
        </button>
      </div>

      {/* content */}
      <div className="relative">
        {loading ? (
          <div className="p-4 grid gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="animate-pulse p-3 rounded-lg border bg-white">
                <div className="h-3 bg-gray-200 rounded w-2/3 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="p-8 text-sm text-gray-500 text-center">
            No accepted/rejected notifications yet
          </div>
        ) : (
          <ul className="max-h-[60vh] overflow-y-auto divide-y">
            {items.map((n) => {
              const isUnread = !n?.isRead;
              const jobTitle = n?.data?.jobTitle || "—";
              const companyName = n?.data?.companyName || "Company";
              const status = n?.status || n?.data?.status || "Update";
              const statusIntent = status === "Accepted" ? "success" : status === "Rejected" ? "warn" : "info";

              const title = n?.title || `Application ${status} — ${jobTitle}`;
              const body =
                n?.body ||
                (status === "Accepted"
                  ? `Hi, your application for ${jobTitle} in ${companyName} has been accepted.`
                  : status === "Rejected"
                  ? `Hi, your application for ${jobTitle} in ${companyName} has been rejected.`
                  : `Update on your application for ${jobTitle} at ${companyName}.`);

              return (
                <li
                  key={n._id}
                  className={`px-3 py-3 ${isUnread ? "bg-amber-50" : "bg-white"} hover:bg-gray-50 transition`}
                >
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-700 font-medium grid place-items-center shrink-0">
                      {getInitials(companyName || jobTitle)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="text-sm font-semibold text-gray-900 truncate">{title}</div>
                        {isUnread && <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />}
                        <Chip intent={statusIntent}>{status}</Chip>
                        {n.type && <Chip>{n.type}</Chip>}
                      </div>

                      <div className="text-sm text-gray-700 mt-0.5">{body}</div>

                      <div className="mt-1 text-[11px] text-gray-500 flex gap-3 flex-wrap">
                        <span>
                          Job: <span className="font-medium text-gray-700">{jobTitle}</span>
                        </span>
                        <span>{timeAgo(n.createdAt)}</span>
                      </div>

                      <div className="mt-2 flex items-center gap-2">
                        {isUnread && (
                          <button
                            onClick={() => markRead(n._id)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-gray-200 hover:bg-gray-50 text-xs"
                          >
                            <CheckCircle2 size={14} />
                            Read
                          </button>
                        )}
                        {n?.data?.jobId && (
                          <a
                            href={`/student/jobs/${n.data.jobId}`}
                            className="text-xs text-blue-700 hover:underline"
                            onClick={onClose}
                          >
                            View job →
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {refreshing && (
          <div className="absolute top-2 right-2 text-gray-500">
            <Loader2 size={16} className="animate-spin" />
          </div>
        )}
      </div>

      {/* footer */}
      <div className="flex items-center justify-between px-3 py-2 border-t bg-gray-50">
        <div className="text-xs text-gray-500">
          Unread: <span className="font-medium">{unreadCount}</span>
        </div>
        <a href="/student/notifications" className="text-xs text-blue-700 hover:underline" onClick={onClose}>
          View all notifications →
        </a>
      </div>
    </div>
  );
}

/* --------------- Header Bar --------------- */
export default function StudentHeaderBar({
  student = { firstName: "", lastName: "", course: "", profilePicture: "" },
  onToggleSidebar,
  title = "Dashboard",
}) {
  const fullName = `${student.firstName || ""} ${student.lastName || ""}`.trim();

  const [openPopover, setOpenPopover] = useState(false);
  const [unreadBadge, setUnreadBadge] = useState(0);
  const token = typeof window !== "undefined" ? localStorage.getItem("ic_token") : null;

  // badge count polling — only Accepted/Rejected + type=status
  async function refreshBadge() {
    try {
      const url = `${API_BASE}/api/student/notifications?limit=20&page=1&type=${encodeURIComponent(
        PERM_TYPE
      )}&statuses=${encodeURIComponent("Accepted,Rejected")}`;

      const r = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const j = await r.json();
      if (!r.ok) throw new Error();

      const list = Array.isArray(j) ? j : j.notifications || [];
      const filtered = list.filter(
        (n) =>
          String(n?.type || "").toLowerCase() === PERM_TYPE &&
          ALLOWED_STATUSES.has(n?.status || n?.data?.status)
      );
      setUnreadBadge(filtered.filter((n) => !n?.isRead).length);
    } catch {
      // keep last
    }
  }
  useEffect(() => {
    refreshBadge();
    const id = setInterval(refreshBadge, 30_000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <header className="relative h-16 bg-[#173B8A] text-white flex items-center justify-between px-4 md:px-6 ml-1">
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

      <div className="flex items-center gap-6">
        {/* Bell with tiny unread dot + popover */}
        <div className="relative">
          <button
            className="relative hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-white/40 rounded p-1"
            title="Notifications"
            type="button"
            onClick={() => setOpenPopover((v) => !v)}
            aria-label={`Notifications${unreadBadge > 0 ? ": unread" : ""}`}
          >
            <Bell className="w-5 h-5" />
            {unreadBadge > 0 && (
              <span
                className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-[#173B8A] animate-pulse"
                aria-hidden="true"
              />
            )}
          </button>

          <StudentNotifPopover
            open={openPopover}
            onClose={() => {
              setOpenPopover(false);
              setTimeout(refreshBadge, 400); // update the dot after marking read
            }}
          />
        </div>

        {/* Avatar + name/course */}
        <div className="flex items-center gap-3 min-w-0">
          {student?.profilePicture ? (
            <img
              src={student.profilePicture}
              alt="Profile"
              className="w-8 h-8 rounded-full object-cover border-2 border-white shrink-0"
            />
          ) : (
            <div className="w-8 h-8 rounded bg-white/80 text-[#173B8A] font-semibold grid place-items-center shrink-0">
              {getInitials(fullName || "Student")}
            </div>
          )}
          <div className="leading-tight text-left min-w-0">
            <div className="font-medium truncate">{fullName || "Student"}</div>
            <div className="text-xs text-white/80 truncate">{student.course || "No Course"}</div>
          </div>
        </div>
      </div>
    </header>
  );
}
